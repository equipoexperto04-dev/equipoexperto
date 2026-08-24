import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { analyticsPromise } from './lib/firebase.js'
import { installFetchAccessTokenRenewal } from './utils/renewSessionToken.js'
import { removeLegacyAuthToken } from './utils/sessionClient.js'
import './index.css'
import './App.css'

removeLegacyAuthToken()
installFetchAccessTokenRenewal()
void analyticsPromise

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)

// Tell chunk-recovery script the app mounted — clears retry budget and mm_build from URL.
requestAnimationFrame(() => {
  try {
    window.dispatchEvent(new Event('mm:app-ready'))
  } catch {
    /* noop */
  }
})
