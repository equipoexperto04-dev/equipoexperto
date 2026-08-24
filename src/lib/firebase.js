import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyCph4cpkermTM6aMPH0bS_xqWsVCXV4VD8',
  authDomain: 'project-62bc5c10-6bba-401a-b93.firebaseapp.com',
  projectId: 'project-62bc5c10-6bba-401a-b93',
  storageBucket: 'project-62bc5c10-6bba-401a-b93.firebasestorage.app',
  messagingSenderId: '332701304852',
  appId: '1:332701304852:web:931de61be73cd25c423f01',
  measurementId: 'G-DKLTREQQ8M',
}

function readFirebaseValue(envKey, fallbackKey) {
  const fromEnv = import.meta.env?.[envKey]
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim()
  }
  return fallbackFirebaseConfig[fallbackKey]
}

const firebaseConfig = {
  apiKey: readFirebaseValue('VITE_FIREBASE_API_KEY', 'apiKey'),
  authDomain: readFirebaseValue('VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'),
  projectId: readFirebaseValue('VITE_FIREBASE_PROJECT_ID', 'projectId'),
  storageBucket: readFirebaseValue('VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'),
  messagingSenderId: readFirebaseValue('VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'),
  appId: readFirebaseValue('VITE_FIREBASE_APP_ID', 'appId'),
  measurementId: readFirebaseValue('VITE_FIREBASE_MEASUREMENT_ID', 'measurementId'),
}

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const shouldBootstrapFirebaseAuth =
  import.meta.env.VITE_USE_FIREBASE_EMAIL_PASSWORD === 'true'

export const firebaseConfigured = requiredKeys.every((key) => {
  const value = firebaseConfig[key]
  return typeof value === 'string' && value.trim()
})

export const firebaseApp = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const firebaseAuth =
  firebaseApp && shouldBootstrapFirebaseAuth ? getAuth(firebaseApp) : null

if (!firebaseConfigured && import.meta.env.DEV) {
  console.warn('[firebase] Firebase env vars are missing; skipping Firebase initialization.')
}

export const firebaseAuthReady = firebaseAuth
  ? setPersistence(firebaseAuth, browserLocalPersistence)
      .then(() => firebaseAuth)
      .catch(() => firebaseAuth)
  : Promise.resolve(null)

export const analyticsPromise =
  firebaseApp && firebaseConfig.measurementId && typeof window !== 'undefined'
    ? analyticsSupported()
        .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
        .catch(() => null)
    : Promise.resolve(null)
