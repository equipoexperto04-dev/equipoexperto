import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  verifyPasswordResetCode,
} from 'firebase/auth'
import API_URL from '../config.js'
import { firebaseAuth, firebaseAuthReady } from '../lib/firebase.js'
import { parseJsonResponse } from './parseJsonResponse.js'
import { persistAppSession } from './sessionClient.js'

export const shouldUseFirebaseEmailPassword =
  import.meta.env.VITE_USE_FIREBASE_EMAIL_PASSWORD === 'true'

export const shouldRequireEmailVerification =
  import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION === 'true'

function ensureFirebaseConfigured() {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured.')
  }
}

export function mapFirebaseAuthError(error, fallback = 'Authentication failed.') {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return 'The request timed out. Please try again.'
  }

  const code = error?.code

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please try again.'
    case 'auth/configuration-not-found':
      return 'Firebase Email/Password auth is not configured for this project.'
    case 'auth/operation-not-allowed':
      return 'Firebase Email/Password sign-in is disabled for this project.'
    case 'auth/missing-password':
      return 'Password is required.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/expired-action-code':
      return 'This password reset link has expired.'
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid.'
    default:
      return typeof error?.message === 'string' && error.message ? error.message : fallback
  }
}

export function isFirebaseEmailPasswordUnavailable(error) {
  return (
    error?.code === 'auth/configuration-not-found' ||
    error?.code === 'auth/operation-not-allowed'
  )
}

async function exchangeFirebaseSession({ user, profile = null, createIfMissing = false }) {
  const idToken = await user.getIdToken(true)

  const res = await fetch(`${API_URL}/auth/firebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      idToken,
      profile,
      createIfMissing,
    }),
  })

  const data = await parseJsonResponse(res)
  if (!data.success) {
    throw new Error(data.message || 'Could not establish an authenticated session.')
  }

  return data
}

export async function registerWithFirebase({ name, companyName, email, password }) {
  ensureFirebaseConfigured()
  await firebaseAuthReady

  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)

  if (name?.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() }).catch(() => {})
  }

  return exchangeFirebaseSession({
    user: credential.user,
    createIfMissing: true,
    profile: {
      name,
      company_name: companyName,
    },
  })
}

export async function loginWithFirebase(email, password) {
  ensureFirebaseConfigured()
  await firebaseAuthReady

  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
  return exchangeFirebaseSession({
    user: credential.user,
    createIfMissing: false,
  })
}

export async function sendFirebasePasswordReset(email) {
  ensureFirebaseConfigured()
  await firebaseAuthReady

  await sendPasswordResetEmail(firebaseAuth, email)
}

export async function verifyFirebaseResetCode(actionCode) {
  ensureFirebaseConfigured()
  await firebaseAuthReady

  return verifyPasswordResetCode(firebaseAuth, actionCode)
}

export async function resetPasswordWithFirebase(actionCode, newPassword) {
  ensureFirebaseConfigured()
  await firebaseAuthReady

  await confirmPasswordReset(firebaseAuth, actionCode, newPassword)
}
