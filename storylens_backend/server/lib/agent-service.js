import OpenAI from 'openai'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sessions = new Map()
const ARTIFACT_CONTEXT_QA_PAIRS = 6
const ARTIFACT_CONTEXT_MESSAGES = ARTIFACT_CONTEXT_QA_PAIRS * 2
const ROUTE_CONTEXT_MESSAGES = 8
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ARTIFACT_KNOWLEDGE_PATH = path.join(__dirname, '../data/artifact_knowledge.json')

function safeText(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}
function normalizeArtifactKnowledgeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null

  const out = {}
  const scalarFields = [
    'id',
    'name',
    'hallName',
    'story',
    'history',
    'function',
    'culturalMeaning',
    'craftsmanship',
    'period',
    'culture',
    'materials',
  ]

  for (const field of scalarFields) {
    const value = safeText(entry[field]).trim()
    if (value) out[field] = value
  }

  if (Array.isArray(entry.highlights)) {
    const highlights = entry.highlights.map((h) => safeText(h).trim()).filter(Boolean)
    if (highlights.length) out.highlights = highlights
  }

  return Object.keys(out).length ? out : null
}

function loadArtifactKnowledgeMap() {
  try {
    const raw = readFileSync(ARTIFACT_KNOWLEDGE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return new Map()

    const map = new Map()
    for (const [id, value] of Object.entries(parsed)) {
      const key = safeText(id).trim().toLowerCase()
      if (!key) continue
      const normalized = normalizeArtifactKnowledgeEntry(value)
      if (normalized) map.set(key, normalized)
    }
    return map
  } catch (_err) {
    return new Map()
  }
}

const ARTIFACT_KNOWLEDGE_MAP = loadArtifactKnowledgeMap()

function getArtifactKnowledge(artifact) {
  const id = safeText(artifact?.id).trim().toLowerCase()
  if (!id) return null
  return ARTIFACT_KNOWLEDGE_MAP.get(id) || null
}

function buildSystemPrompt(artifact) {
  const id = safeText(artifact?.id)
  const name = safeText(artifact?.name)
  const hallName = safeText(artifact?.hallName)

  return [
    "You are a museum guide AI speaking to a general visitor in a gallery.",
    "Answer only about the current artifact and do not mix in information from other artifacts.",
    "Speak in a warm, natural, approachable way, like a human guide talking in person.",
    "Do not sound like a textbook, catalog entry, report, or customer service script.",
    "Use clear English and explain ideas in a way non-expert visitors can easily follow.",
    "",
    "Style goals:",
    "- Answer the visitor's question first, then add 1-2 helpful layers of context.",
    "- Keep the tone calm, engaging, and informative.",
    "- Vary your openings naturally; do not repeatedly start with phrases like 'Hello', 'You are looking at', or 'Welcome'.",
    "- For follow-up questions, continue smoothly without restarting the whole introduction.",
    "- Avoid repeating the same background details across consecutive turns unless needed for clarity.",
    "- Each new answer should add a fresh angle when possible, such as function, symbolism, craftsmanship, historical setting, or what to notice.",
    "- Do not repeat the same sentence pattern across nearby turns.",
    "- Never use the exact phrase 'One detail worth noticing is'.",
    "- Avoid repeatedly using closing phrases such as 'If you're curious' or 'I'd be happy to share more'.",
    "",
    "Content rules:",
    "- Use the provided artifact context as the main factual basis.",
    "- If the context is incomplete, be honest and use careful wording such as 'likely', 'may have', or 'is often associated with'.",
    "- Do not invent exact facts, dates, locations, ritual details, or claims of certainty that are not supported by the provided context.",
    "- If the user asks something beyond the current artifact, say so clearly and gently guide them back.",
    "",
    "Structure guidance:",
    "- Usually write 2-3 short paragraphs, not one long block.",
    "- For simple questions, keep the answer concise.",
    "- For history or background questions, add slightly more context, but stay focused.",
    "- Add an observation point only when it genuinely helps the answer; do not force one into every response.",
    "- When you include an observation point, vary the wording naturally, for example: 'You might notice...', 'What stands out here is...', 'A striking feature is...', or 'It is worth looking closely at...'.",
    "- Do not add a follow-up invitation in every answer; sometimes end naturally without one.",
    "- Avoid rigid labels such as 'Overview', 'Key Feature', or 'Next Steps'.",
    "",
    "Artifact-specific guidance:",
    "- For sculptures, you may focus on pose, gesture, expression, proportions, or symbolic form.",
    "- For vessels and ceramics, you may focus on shape, glaze, motif, decoration, and use.",
    "- For tablets or inscribed objects, you may focus on writing, surface marks, layout, and recording function.",
    "- For masks or ritual objects, you may focus on performance, symbolism, carved features, and ceremonial use.",
    "",
    id ? `Current artifact id: ${id}` : "Current artifact id: unknown",
    name ? `Current artifact name: ${name}` : "Current artifact name: unknown",
    hallName ? `Current hall: ${hallName}` : "Current hall: unknown"
  ].join("\n")
}

function hasUsableValue(value) {
  if (value == null) return false
  const text = String(value).trim()
  if (!text) return false
  if (/^todo\b/i.test(text)) return false
  return true
}

function buildArtifactContext(artifact) {
  const lines = []
  if (!artifact || typeof artifact !== 'object') {
    return '(No artifact data provided)'
  }

  const kb = getArtifactKnowledge(artifact) || {}
  const merged = { ...kb, ...artifact }

  if (hasUsableValue(merged.id)) lines.push(`id: ${safeText(merged.id)}`)
  if (hasUsableValue(merged.name)) lines.push(`name: ${safeText(merged.name)}`)
  if (hasUsableValue(merged.hallName)) {
    lines.push(`hallName: ${safeText(merged.hallName)}`)
  }
  if (hasUsableValue(merged.period)) lines.push(`period: ${safeText(merged.period)}`)
  if (hasUsableValue(merged.culture)) lines.push(`culture: ${safeText(merged.culture)}`)
  if (hasUsableValue(merged.materials)) {
    lines.push(`materials: ${safeText(merged.materials)}`)
  }

  if (hasUsableValue(merged.story)) lines.push(`story: ${safeText(merged.story)}`)
  if (hasUsableValue(merged.history)) lines.push(`history: ${safeText(merged.history)}`)
  if (hasUsableValue(merged.function)) {
    lines.push(`function: ${safeText(merged.function)}`)
  }
  if (hasUsableValue(merged.culturalMeaning)) {
    lines.push(`culturalMeaning: ${safeText(merged.culturalMeaning)}`)
  }
  if (hasUsableValue(merged.craftsmanship)) {
    lines.push(`craftsmanship: ${safeText(merged.craftsmanship)}`)
  }

  if (Array.isArray(merged.highlights)) {
    const usableHighlights = merged.highlights
      .map((h) => safeText(h))
      .filter((h) => hasUsableValue(h))

    if (usableHighlights.length) {
      lines.push(`highlights: ${usableHighlights.join(' | ')}`)
    }
  }

  return lines.length ? lines.join('\n') : '(No artifact data provided)'
}

function createEmptySessionState() {
  return {
    routeHistory: [],
    artifactHistories: {},
  }
}

function normalizeSessionState(raw) {
  if (!raw) return createEmptySessionState()

  if (Array.isArray(raw)) {
    // Backward compatibility for older in-memory format.
    return {
      routeHistory: [],
      artifactHistories: { __legacy__: raw },
    }
  }

  const routeHistory = Array.isArray(raw.routeHistory) ? raw.routeHistory : []
  const artifactHistories =
    raw.artifactHistories && typeof raw.artifactHistories === 'object'
      ? raw.artifactHistories
      : {}

  return {
    routeHistory,
    artifactHistories,
  }
}

function getSessionState(sessionId) {
  const normalized = normalizeSessionState(sessions.get(sessionId))
  sessions.set(sessionId, normalized)
  return normalized
}

function getArtifactSessionKey(artifact) {
  const id = safeText(artifact?.id).trim()
  if (id) return `id:${id}`

  const name = safeText(artifact?.name).trim()
  const hallName = safeText(artifact?.hallName).trim()
  const composite = `${name}||${hallName}`.trim()
  if (composite && composite !== '||') return `namehall:${composite}`

  return 'unknown-artifact'
}

function getArtifactHistory(sessionState, artifactKey) {
  const byKey = sessionState.artifactHistories[artifactKey]
  if (Array.isArray(byKey)) return byKey

  const legacy = sessionState.artifactHistories.__legacy__
  if (Array.isArray(legacy)) return legacy

  return []
}

function normalizeRouteZones(zones) {
  if (!Array.isArray(zones)) return []
  return zones
    .filter((zone) => zone && typeof zone === 'object')
    .map((zone) => ({
      id: safeText(zone.id).toUpperCase(),
      shortName: safeText(zone.shortName),
      roomLabel: safeText(zone.roomLabel),
      hint: safeText(zone.hint),
      previewExhibits: Array.isArray(zone.previewExhibits)
        ? zone.previewExhibits.map((v) => safeText(v)).filter(Boolean)
        : [],
      visitTags: Array.isArray(zone.visitTags)
        ? zone.visitTags.map((v) => safeText(v)).filter(Boolean)
        : [],
      bestFor: Array.isArray(zone.bestFor)
        ? zone.bestFor.map((v) => safeText(v)).filter(Boolean)
        : [],
      routeRole: safeText(zone.routeRole),
      pace: safeText(zone.pace),
      atmosphere: safeText(zone.atmosphere),
    }))
}

function getRouteMode(userQuestion, selectedIntent) {
  const text = `${safeText(userQuestion)} ${safeText(selectedIntent)}`.toLowerCase()

  if (
    text.includes('short') ||
    text.includes('quick') ||
    text.includes('brief') ||
    text.includes('limited time') ||
    text.includes('not much time') ||
    text.includes('in a hurry') ||
    text.includes('30 minutes') ||
    text.includes('20 minutes')
  ) {
    return 'short'
  }

  if (
    text.includes('detailed') ||
    text.includes('more in depth') ||
    text.includes('deeper') ||
    text.includes('more detail') ||
    text.includes('take my time') ||
    text.includes('explore more')
  ) {
    return 'detailed'
  }

  if (
    text.includes('highlight') ||
    text.includes('highlights') ||
    text.includes('key pieces') ||
    text.includes('main pieces') ||
    text.includes('best of')
  ) {
    return 'highlights'
  }

  return 'default'
}

function getBaseRoute(focusedZone, routeMode) {
  const zone = safeText(focusedZone || 'H1').toUpperCase()

  if (routeMode === 'short') {
    if (zone === 'H1') return ['H1', 'H3']
    if (zone === 'H2') return ['H2', 'H3']
    return ['H3', 'H1']
  }

  if (routeMode === 'highlights') {
    if (zone === 'H1') return ['H1', 'H3']
    if (zone === 'H2') return ['H3', 'H2']
    return ['H3', 'H1']
  }

  if (routeMode === 'detailed') {
    if (zone === 'H1') return ['H1', 'H3', 'H2']
    if (zone === 'H2') return ['H2', 'H3', 'H1']
    return ['H3', 'H1', 'H2']
  }

  if (zone === 'H1') return ['H1', 'H3', 'H2']
  if (zone === 'H2') return ['H2', 'H3', 'H1']
  return ['H3', 'H1', 'H2']
}

function buildRouteSystemPrompt(routeContext) {
  const focusedZone = safeText(routeContext?.focusedZone || 'H1').toUpperCase()
  const zones = normalizeRouteZones(routeContext?.zones)
  const activeZoneName =
    zones.find((zone) => zone.id === focusedZone)?.shortName || 'Unknown'

  const zoneLines = zones.length
    ? zones
        .map((zone) => {
          const exhibits = zone.previewExhibits.join(', ') || 'N/A'
          const tags = zone.visitTags.join(', ') || 'N/A'
          const bestFor = zone.bestFor.join(', ') || 'N/A'
          return [
            `${zone.id} ${zone.shortName} (${zone.roomLabel})`,
            `Overview: ${zone.hint || 'N/A'}`,
            `Route role: ${zone.routeRole || 'N/A'}`,
            `Best for: ${bestFor}`,
            `Style tags: ${tags}`,
            `Pace: ${zone.pace || 'N/A'}`,
            `Atmosphere: ${zone.atmosphere || 'N/A'}`,
            `Featured exhibits: ${exhibits}`,
          ].join('. ') + '.'
        })
        .join('\n')
    : '(No route zone data provided)'

  return [
    'You are a museum route planning assistant.',
    'Your primary job is to recommend a clear, suitable route for the visitor through the available museum zones.',
    'Exhibit highlights should support the route recommendation, not replace it.',
    'Persona: a professional museum guide who is calm, welcoming, concise, and culturally respectful.',
    'Available route zones:',
    zoneLines,
    `Current focused zone on map: ${activeZoneName}.`,
    'Prefer a route that begins from the visitor\'s current focused zone when it makes sense.',
    'Always use H1/H2/H3 zone codes and make the route order explicit.',
    'When planning a route, prioritize in this order: visitor request, route mode, current focused zone, route coherence, then highlights.',
    'Use zone metadata such as route role, best-for labels, pace, and style tags to justify why a route fits the visitor.',
    'Give one main route first, and keep that route order consistent throughout the answer.',
    'Do not introduce alternative route orders unless the visitor clearly asks for another option.',
    'Treat follow-up requests as refinements of the current route unless the visitor clearly asks for a completely new recommendation.',
    'Use advisory guidance, not command-style phrasing.',
    'Keep the guidance natural and conversational, not like a report or checklist.',
    'If information is limited, briefly acknowledge the limit and give a best-effort route using only known information.',
    'Do not invent exact walking distances, exact room connections, or exact visit duration unless explicitly provided.',
  ].join('\n')
}

function buildRouteUserPrompt(routeContext, question) {
  const focusedZone = safeText(routeContext?.focusedZone || 'H1').toUpperCase()
  const selectedIntent = safeText(routeContext?.selectedIntent || 'none')
  const routeMode = getRouteMode(question, selectedIntent)
  const suggestedRoute = getBaseRoute(focusedZone, routeMode)

  return [
    'Visitor profile:',
    `- selected_quick_intent: ${selectedIntent}`,
    `- currently_focused_zone: ${focusedZone}`,
    `- recommended_route_mode: ${routeMode}`,
    `- suggested_base_route: ${suggestedRoute.join(' -> ')}`,
    '',
    'User request:',
    safeText(question),
    '',
    'Output rules:',
    '- Use plain English.',
    '- Keep total length around 90-140 words.',
    "- Treat the user's free-text request as highest priority; use selected options only as defaults.",
    '- Give one main recommended route first, not several competing routes.',
    "- Use the suggested_base_route as the default main route unless the user's request clearly requires a different one.",
    '- If recommended_route_mode is short, the main route itself should stay short rather than presenting a full route first.',
    '- Use H1/H2/H3 clearly and keep the route order fully consistent throughout the answer.',
    '- Use warm advisory language rather than commands.',
    "- Avoid generic openings such as 'Welcome!'; begin with a natural route-focused opener.",
    '- Briefly explain why the route suits the visitor\'s situation.',
    '- Mention 1-2 highlights only if they strengthen the recommendation.',
    "- If the visitor is on their own, prefer a flexible, easy-to-follow route with a comfortable pace.",
    '- If information is unknown, acknowledge it briefly instead of inventing details.',
    '- If this message looks like a follow-up, refine the current route rather than restarting from scratch.',
    "- In the 'Key route:' sentence, use advisory phrasing rather than direct commands.",
    "- Prefer wording like 'I'd recommend H1 -> H3 -> H2' or 'A good route would be H1 -> H3 -> H2'.",
    "- Do not use command-style wording such as 'Start at..., then move to...'.",
    "- Avoid repeating the exact same route sentence twice; use 'Key route:' as the clearest route statement and let the surrounding sentences explain why it fits.",
    '- End with a route-adjustment offer only when helpful.',
    '',
    'Refinement guidance:',
    '- If the visitor says they only have a short time, the main recommended route itself should become shorter or lighter.',
    '- In short-time cases, do not give a full-length main route and then add a shorter alternative underneath.',
    '- If the visitor asks for a shorter version, simplify the main route to fewer zones or a lighter pace.',
    '- If the visitor asks for a more detailed version, keep the same main route unless needed, but add slightly richer reasons for each stop or for the overall pacing.',
    '- If the visitor asks for a highlight-focused version, emphasize the most memorable stops rather than broad coverage.',
    '- For a more detailed version, expand the explanation with more specific reasons or pacing guidance, not just longer descriptive wording.',
    '- For detailed replies, add useful depth through clearer reasons, pacing, or stop-by-stop emphasis, not through generic praise or repeated summary wording.',
    '',
    'Preferred flow:',
    '- Start with one short natural opener tailored to the visitor profile.',
    "- Include one sentence beginning with 'Key route:' that gives the clearest recommended order.",
    '- Add 1-2 natural sentences explaining why this route fits.',
    '- Optionally mention 1-2 worthwhile highlights.',
    "- Add one short line beginning with 'If short on time:' only for initial general route recommendations. Do not include it in short-route or follow-up refinement replies unless the visitor explicitly asks for it.",
  ].join('\n')
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
  const agentType = safeText(payload.agentType).toLowerCase()
  const isRouteAgent = agentType === 'route'

  if (!question) {
    const error = new Error('question is required')
    error.statusCode = 400
    throw error
  }

  let sessionId = safeText(payload.sessionId).trim()
  if (!sessionId) sessionId = newSessionId()

  const sessionState = getSessionState(sessionId)
  const artifactKey = getArtifactSessionKey(artifact)
  const history = isRouteAgent
    ? sessionState.routeHistory
    : getArtifactHistory(sessionState, artifactKey)
  const messages = isRouteAgent
    ? [
        { role: 'system', content: buildRouteSystemPrompt(payload.routeContext || {}) },
        ...history.slice(-ROUTE_CONTEXT_MESSAGES),
        { role: 'user', content: buildRouteUserPrompt(payload.routeContext || {}, question) },
      ]
    : [
        { role: 'system', content: buildSystemPrompt(artifact) },
        ...history.slice(-ARTIFACT_CONTEXT_MESSAGES),
        {
          role: 'user',
          content: `Current artifact data:\n${buildArtifactContext(artifact)}\n\nUser question:\n${question}`,
        },
      ]

  return {
    question,
    sessionId,
    history,
    artifactKey,
    isRouteAgent,
    messages,
  }
}

function persistSession(sessionId, history, question, answer, isRouteAgent, artifactKey) {
  const updatedHistory = history.concat(
    { role: 'user', content: question },
    { role: 'assistant', content: answer },
  )

  const state = getSessionState(sessionId)
  if (isRouteAgent) {
    state.routeHistory = updatedHistory
  } else {
    state.artifactHistories[artifactKey || 'unknown-artifact'] = updatedHistory
  }
  sessions.set(sessionId, state)
}

export async function generateArtifactAnswer(body) {
  const payload = body || {}
  const { question, sessionId, history, artifactKey, isRouteAgent, messages } =
    buildMessages(payload)

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
  persistSession(sessionId, history, question, answer, isRouteAgent, artifactKey)

  return {
    sessionId,
    answer,
  }
}

export async function streamArtifactAnswer(body, onChunk, onDone, onError) {
  try {
    const payload = body || {}
    const { question, sessionId, history, artifactKey, isRouteAgent, messages } =
      buildMessages(payload)

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
      persistSession(sessionId, history, question, answer, isRouteAgent, artifactKey)

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




