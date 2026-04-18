import OpenAI from 'openai'

const sessions = new Map()

function safeText(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function buildSystemPrompt(artifact) {
  const name = safeText(artifact?.name)
  return [
    'You are a museum guide AI.',
    'Answer only about the current artifact and do not mix in information from other artifacts.',
    'If the question goes beyond the current artifact or the provided material is insufficient, clearly say that you are unsure or that more official museum information is needed, then guide the user toward a more specific question.',
    'Respond in English and prioritize clear explanations that general visitors can easily understand.',
    name ? `Current artifact name: ${name}` : 'Current artifact name: unknown',
  ].join('\n')
}

function buildArtifactContext(artifact) {
  const lines = []
  if (!artifact || typeof artifact !== 'object') return '(No artifact data provided)'
  if (artifact.id) lines.push(`id: ${safeText(artifact.id)}`)
  if (artifact.name) lines.push(`name: ${safeText(artifact.name)}`)
  if (artifact.hallName) lines.push(`hallName: ${safeText(artifact.hallName)}`)
  if (artifact.story) lines.push(`story: ${safeText(artifact.story)}`)
  return lines.length ? lines.join('\n') : '(No artifact data provided)'
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
      content: `Current artifact data:\n${buildArtifactContext(artifact)}\n\nUser question:\n${question}`,
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

  const answer =
    safeText(response.choices?.[0]?.message?.content).trim() ||
    '(No answer generated)'
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

      const answer = safeText(collected).trim() || '(No answer generated)'
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
