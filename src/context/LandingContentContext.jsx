import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from './LanguageContext'

const LANDING_QUERY = `*[_type == "landingPage" && _id == $id][0]`

const LandingContentContext = createContext(null)

export function pickLocale(localeField, language) {
  if (!localeField || typeof localeField !== 'object') return ''
  const raw = localeField[language] ?? localeField.en ?? localeField.es ?? ''
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : ''
}

export function LandingContentProvider({ children }) {
  const { language } = useTranslation()
  const [landing, setLanding] = useState(null)
  const [cmsEnabled, setCmsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    import('../lib/sanityClient')
      .then(({ sanityClient, sanityConfigured }) => {
        if (cancelled) return
        setCmsEnabled(Boolean(sanityConfigured))
        if (!sanityClient) {
          setLoading(false)
          return
        }
        return sanityClient.fetch(LANDING_QUERY, { id: 'landingPage' })
      })
      .then((data) => {
        if (!cancelled) {
          setLanding(data || null)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[Sanity] Failed to load landing content', err)
          setError(err)
          setLanding(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const pick = useMemo(
    () => (localeField) => pickLocale(localeField, language),
    [language],
  )

  const value = useMemo(
    () => ({
      landing,
      loading,
      error,
      pick,
      cmsEnabled,
    }),
    [landing, loading, error, pick, cmsEnabled],
  )

  return <LandingContentContext.Provider value={value}>{children}</LandingContentContext.Provider>
}

export function useLandingContent() {
  const ctx = useContext(LandingContentContext)
  if (!ctx) {
    throw new Error('useLandingContent must be used within LandingContentProvider')
  }
  return ctx
}
