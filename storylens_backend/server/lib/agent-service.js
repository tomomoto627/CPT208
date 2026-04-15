import OpenAI from 'openai'

const sessions = new Map()

function safeText(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function buildSystemPrompt(artifact) {
  const name = safeText(artifact?.name)
  return [
    '你是一名博物馆讲解员 AI。',
    '你只能围绕“当前文物”回答用户问题，不要混入其他文物的信息。',
    '如果用户问题超出当前文物或资料不足，请明确说明“不确定/需要更多馆方资料”，并引导用户提更具体的问题。',
    '请使用中文回答，优先给出清晰、适合大众理解的讲解。',
    name ? `当前文物名称：${name}` : '当前文物名称：未知',
  ].join('\n')
}

function buildArtifactContext(artifact) {
  const lines = []
  if (!artifact || typeof artifact !== 'object') return '（未提供文物资料）'
  if (artifact.id) lines.push(`id: ${safeText(artifact.id)}`)
  if (artifact.name) lines.push(`name: ${safeText(artifact.name)}`)
  if (artifact.hallName) lines.push(`hallName: ${safeText(artifact.hallName)}`)
  if (artifact.story) lines.push(`story: ${safeText(artifact.story)}`)
  return lines.length ? lines.join('\n') : '（未提供文物资料）'
}

function newSessionId() {
  return `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function createOpenAIClient() {
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com'
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || ''

  if (!apiKey) {
    throw new Error('Missing required env var: DEEPSEEK_API_KEY or OPENAI_API_KEY')
  }

  return new OpenAI({
    apiKey,
    baseURL,
  })
}

function buildMessages(payload) {
  const question = safeText(payload.question).trim()
  const artifact = payload.artifact || payload.artifactContext || {}

  if (!question) {
    const error = new Error('question is required')
    error.statusCode = 400
    throw error
  }

  let sessionId = safeText(payload.sessionId).trim()
  if (!sessionId) sessionId = newSessionId()

  const history = sessions.get(sessionId) || []
  const messages = [
    { role: 'system', content: buildSystemPrompt(artifact) },
    ...history.slice(-8),
    {
      role: 'user',
      content: `当前文物资料：\n${buildArtifactContext(artifact)}\n\n用户问题：\n${question}`,
    },
  ]

  return {
    question,
    sessionId,
    history,
    messages,
  }
}

function persistSession(sessionId, history, question, answer) {
  const updatedHistory = history.concat(
    { role: 'user', content: question },
    { role: 'assistant', content: answer },
  )

  sessions.set(sessionId, updatedHistory)
}

export async function generateArtifactAnswer(body) {
  const payload = body || {}
  const { question, sessionId, history, messages } = buildMessages(payload)

  const client = createOpenAIClient()
  const model = process.env.OPENAI_MODEL || 'deepseek-chat'

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.6,
    max_tokens: 500,
  })

  const answer = safeText(response.choices?.[0]?.message?.content).trim() || '（未生成回答）'
  persistSession(sessionId, history, question, answer)

  return {
    sessionId,
    answer,
  }
}

export async function streamArtifactAnswer(body, onChunk, onDone, onError) {
  try {
    const payload = body || {}
    const { question, sessionId, history, messages } = buildMessages(payload)

    const client = createOpenAIClient()
    const model = process.env.OPENAI_MODEL || 'deepseek-chat'

    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 500,
      stream: true,
    })

    if (onDone) onDone({ type: 'session', sessionId })

    let collected = ''

    try {
      for await (const part of stream) {
        const delta = part?.choices?.[0]?.delta?.content ?? part?.choices?.[0]?.text ?? ''
        if (!delta) continue

        collected += delta

        try {
          onChunk?.({
            type: 'delta',
            sessionId,
            delta: String(delta),
          })
        } catch (_err) {
          // ignore chunk handler errors
        }
      }

      const answer = safeText(collected).trim() || '（未生成回答）'
      persistSession(sessionId, history, question, answer)

      onDone?.({
        type: 'done',
        sessionId,
        answer,
      })
    } catch (err) {
      if (onError) onError(err)
      else throw err
    }
  } catch (err) {
    if (onError) onError(err)
    else throw err
  }
}

export function getCorsHeaders(origin) {
  const allowedOrigin = process.env.CORS_ORIGIN || '*'
  const headers = {
    'Access-Control-Allow-Methods': 'POST,OPTIONS,GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (allowedOrigin === '*') {
    headers['Access-Control-Allow-Origin'] = '*'
    return headers
  }

  if (origin && origin === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = origin
    headers.Vary = 'Origin'
  }

  return headers
}
