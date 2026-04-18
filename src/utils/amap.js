/**
 * Dynamically load the AMap JS API 2.0 (Web).
 * Apply for a key in the AMap console. If a security code is required,
 * also configure VITE_AMAP_SECURITY_CODE.
 * https://console.amap.com/
 */
let loadPromise = null

export function getAmapKey() {
  const key = import.meta.env.VITE_AMAP_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : ''
}

export function getAmapSecurityCode() {
  const c = import.meta.env.VITE_AMAP_SECURITY_CODE
  return typeof c === 'string' && c.trim() ? c.trim() : ''
}

export function loadAmap() {
  const key = getAmapKey()
  if (!key) {
    return Promise.reject(new Error('Missing VITE_AMAP_KEY'))
  }
  if (typeof window !== 'undefined' && window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const security = getAmapSecurityCode()
    if (security) {
      window._AMapSecurityConfig = {
        securityJsCode: security,
      }
    }
    const script = document.createElement('script')
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.onload = () => {
      if (window.AMap) resolve(window.AMap)
      else reject(new Error('AMap was not attached to window'))
    }
    script.onerror = () => reject(new Error('Failed to load the AMap script'))
    document.head.appendChild(script)
  }).catch((err) => {
    loadPromise = null
    return Promise.reject(err)
  })

  return loadPromise
}
