import OpenAI from 'openai'

function safeText(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function cleanLabel(value) {
  return safeText(value).trim()
}

function buildPrompt(labels) {
  return [
    '请识别图像中的文物。',
    '必须且只能从以下类别中选择一个，并且完全一致输出，不要添加任何解释、标点或多余内容。',
    ...labels,
  ].join('\n')
}

function createVisionClient() {
  const apiKey =
    process.env.ARK_API_KEY ||
    process.env.VISION_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  const baseURL =
    process.env.ARK_BASE_URL ||
    process.env.VISION_BASE_URL ||
    'https://ark.cn-beijing.volces.com/api/v3'

  if (!apiKey) {
    const error = new Error(
      'Missing required env var: ARK_API_KEY or VISION_API_KEY',
    )
    error.statusCode = 500
    throw error
  }

  return new OpenAI({
    apiKey,
    baseURL,
  })
}

function pickMatchedLabel(rawAnswer, labels) {
  const exact = labels.find((label) => label === rawAnswer)
  if (exact) return exact

  const normalized = rawAnswer.toLowerCase()
  return (
    labels.find((label) => {
      const lowered = label.toLowerCase()
      return normalized.includes(lowered) || lowered.includes(normalized)
    }) || ''
  )
}

export async function classifyArtifactImage(body) {
  const image = safeText(body?.image).trim()
  const artifacts = Array.isArray(body?.artifacts) ? body.artifacts : []

  if (!image) {
    const error = new Error('image is required')
    error.statusCode = 400
    throw error
  }

  const normalizedArtifacts = artifacts
    .map((item) => ({
      id: cleanLabel(item?.id),
      label: cleanLabel(item?.label || item?.name),
      name: cleanLabel(item?.name || item?.label),
    }))
    .filter((item) => item.id && item.label)

  if (!normalizedArtifacts.length) {
    const error = new Error('artifacts is required')
    error.statusCode = 400
    throw error
  }

  const labels = normalizedArtifacts.map((item) => item.label)
  const client = createVisionClient()
  const model = process.env.ARK_VISION_MODEL || process.env.VISION_MODEL || 'doubao-seed-1-8-251228'

  const response = await client.responses.create({
    model,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: image,
          },
          {
            type: 'input_text',
            text: buildPrompt(labels),
          },
        ],
      },
    ],
  })

  const raw = safeText(response.output_text).trim()
  const matchedLabel = pickMatchedLabel(raw, labels)
  const matchedArtifact =
    normalizedArtifacts.find((item) => item.label === matchedLabel) || null

  return {
    raw,
    matched: Boolean(matchedArtifact),
    matchedLabel: matchedLabel || '',
    artifactId: matchedArtifact?.id || '',
    artifactName: matchedArtifact?.name || '',
  }
}
