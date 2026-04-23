import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

const setViewportUnits = () => {
  if (typeof window === 'undefined') return
  const width = Math.min(
    window.innerWidth,
    window.visualViewport?.width || window.innerWidth,
  )
  const height = Math.min(
    window.innerHeight,
    window.visualViewport?.height || window.innerHeight,
  )

  document.documentElement.style.setProperty('--mq-vw', `${width * 0.01}px`)
  document.documentElement.style.setProperty('--mq-vh', `${height * 0.01}px`)
}

if (typeof window !== 'undefined') {
  setViewportUnits()
  window.addEventListener('orientationchange', setViewportUnits, { passive: true })
  window.addEventListener('pageshow', setViewportUnits, { passive: true })
}

createApp(App).mount('#app')
