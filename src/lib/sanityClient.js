import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01'

export const sanityConfigured = Boolean(projectId && String(projectId).trim())

export const sanityClient = sanityConfigured
  ? createClient({
      projectId: String(projectId).trim(),
      dataset,
      apiVersion,
      useCdn: true,
    })
  : null
