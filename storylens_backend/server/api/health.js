import { getCorsHeaders } from '../lib/agent-service.js'

export default function handler(req, res) {
  const headers = getCorsHeaders(req.headers.origin)
  Object.entries(headers).forEach(([key, value]) => {
    if (value) res.setHeader(key, value)
  })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  res.status(200).json({ ok: true })
}
