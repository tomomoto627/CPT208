import { getCorsHeaders } from '../../lib/agent-service.js'
import { classifyArtifactImage } from '../../lib/vision-service.js'

function setCors(res, origin) {
  const headers = getCorsHeaders(origin)
  Object.entries(headers).forEach(([key, value]) => {
    if (value) res.setHeader(key, value)
  })
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const result = await classifyArtifactImage(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      error: error?.message || 'server error',
    })
  }
}
