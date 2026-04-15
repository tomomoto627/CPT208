import 'dotenv/config'
import express from 'express'
import {
  generateArtifactAnswer,
  getCorsHeaders,
  streamArtifactAnswer,
} from './lib/agent-service.js'

const PORT = Number.parseInt(process.env.PORT || '8787', 10)

const app = express()
app.use(express.json({ limit: '1mb' }))

app.use((req, res, next) => {
  const corsHeaders = getCorsHeaders(req.headers.origin)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) res.setHeader(key, value)
  })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  next()
})

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/agent/chat', async (req, res) => {
  try {
    if (req.body && req.body.stream) {
      const mode = req.body.mode || 'sse'
      const isSse = mode === 'sse'

      if (isSse) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache, no-transform')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.setHeader('Content-Encoding', 'identity')
      } else {
        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
        res.setHeader('Transfer-Encoding', 'chunked')
        res.setHeader('Cache-Control', 'no-cache, no-transform')
      }
      res.socket?.setNoDelay?.(true)
      res.flushHeaders?.()

      let finished = false

      const writeEvent = (event, data) => {
        if (isSse) {
          res.write(`event: ${event}\n`)
          res.write(`data: ${JSON.stringify(data)}\n\n`)
          res.flush?.()
          return
        }

        res.write(`${JSON.stringify({ event, ...data })}\n`)
        res.flush?.()
      }

      // Send one tiny frame immediately so some proxies/clients flush early.
      if (isSse) writeEvent('ping', { ts: Date.now() })

      const onChunk = (chunk) => {
        try {
          writeEvent('delta', chunk)
        } catch (_err) {}
      }

      const onDone = (meta) => {
        if (meta?.type === 'session') {
          try {
            writeEvent('session', { sessionId: meta.sessionId })
          } catch (_err) {}
          return
        }

        if (finished) return
        finished = true

        try {
          writeEvent('done', {
            sessionId: meta?.sessionId,
            answer: meta?.answer || '',
          })
        } catch (_err) {}

        try { res.end() } catch (_err) {}
      }

      const onError = (err) => {
        if (finished) return
        finished = true
        try {
          writeEvent('error', { message: err?.message || String(err) })
        } catch (_err) {}
        try { res.end() } catch (_err) {}
      }

      await streamArtifactAnswer(req.body, onChunk, onDone, onError)
      return
    }

    const result = await generateArtifactAnswer(req.body)
    res.json(result)
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      error: error?.message || 'server error',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[museum-agent-server] listening on http://localhost:${PORT}`)
})
