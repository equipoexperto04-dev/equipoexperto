import API_URL from '../config.js'

export const AUTH_SESSION_CHANGED_EVENT = 'auth:session-changed'

function dispatchSessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
  window.dispatchEvent(new Event('auth:token-changed'))
}

export function readCachedUserProfile() {
  try {
    const raw = localStorage.getItem('user_profile')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function cacheUserProfile(user) {
  if (!user) return
  localStorage.setItem('user_profile', JSON.stringify(user))
  localStorage.setItem('last_profile_sync', Date.now().toString())
}

export function clearClientSession() {
  for (const key of ['token', 'user', 'user_profile', 'last_profile_sync']) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  }
  dispatchSessionChanged()
}

export function persistAppSession(data) {
  try {
    localStorage.removeItem('token')
  } catch {
    /* noop */
  }
  if (data?.user) {
    cacheUserProfile(data.user)
  }
  dispatchSessionChanged()
}

export async function fetchCurrentUserProfile() {
  try {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      credentials: 'include',
    })

    if (res.status === 401) {
      clearClientSession()
      return null
    }

    if (!res.ok) {
      return null
    }

    const data = await res.json().catch(() => null)
    if (data?.success && data.user) {
      cacheUserProfile(data.user)
      return data.user
    }

    return null
  } catch {
    return null
  }
}

export function removeLegacyAuthToken() {
  try {
    localStorage.removeItem('token')
  } catch {
    /* noop */
  }
}
