/**
 * 拼出请求后端的完整 URL。
 * 前后端同域时留空即可（相对路径 /api/...）。
 * 若 API 在别的端口/域名，在 .env 里设 VITE_API_BASE，例如 http://127.0.0.1:8787
 */
export function buildApiUrl(path) {
  const base = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) return p
  return `${base}${p}`
}

export async function streamFetch(path, opts = {}, onChunk = () => {}) {
  const { method = 'POST', body, headers = {}, mode = 'sse' } = opts
  const url = buildApiUrl(path)
  const res = await fetch(url, {
    method,
    body: body && typeof body === 'object' ? JSON.stringify(body) : body,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  if (!res.body) throw new Error('Response has no body to stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  const isSse = mode === 'sse' || contentType.includes('text/event-stream')

  if (isSse) {
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      let splitIdx = -1
      while ((splitIdx = buf.search(/\r?\n\r?\n/)) !== -1) {
        const block = buf.slice(0, splitIdx)
        const sep = buf.slice(splitIdx).match(/^\r?\n\r?\n/)?.[0] || '\n\n'
        buf = buf.slice(splitIdx + sep.length)

        const lines = block.split(/\r?\n/)
        let eventName = 'message'
        const dataLines = []

        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.replace(/^event:\s*/, '').trim()
          if (line.startsWith('data:')) dataLines.push(line.replace(/^data:\s*/, ''))
        }

        const rawData = dataLines.join('\n')
        if (!rawData) continue

        let payload = rawData
        try { payload = JSON.parse(rawData) } catch {}

        if (eventName === 'delta') {
          const text = typeof payload === 'string' ? payload : payload?.delta || ''
          for (const ch of text) onChunk(ch)
        } else if (eventName === 'error') {
          const msg = typeof payload === 'string' ? payload : payload?.message || 'stream error'
          throw new Error(msg)
        } else if (eventName === 'done') {
          return
        }
      }
    }
    return
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const ch of chunk) onChunk(ch)
  }
}


/**
 * 便捷函数：把流式结果拼成完整字符串并可选地在每个字符到达时回调
 */
export async function streamToString(path, opts = {}, onChar) {
  let out = ''
  await streamFetch(path, opts, (ch) => {
    out += ch
    if (onChar) onChar(ch)
  })
  return out
}
