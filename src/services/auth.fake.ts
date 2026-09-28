import type { AuthUser } from '../types'

export const FAKE_AUTH_STORAGE_KEY = 'e2e-fake-auth-users'
export const FAKE_AUTH_SESSION_KEY = 'e2e-fake-auth-session'

interface FakeUserRecord {
  password: string
  confirmed: boolean
  userId: string
}

let currentSession: AuthUser | null = null

function loadSession(): AuthUser | null {
  if (currentSession) return currentSession
  try {
    return JSON.parse(localStorage.getItem(FAKE_AUTH_SESSION_KEY) ?? 'null') as AuthUser | null
  } catch {
    return null
  }
}

function saveSession(user: AuthUser | null): void {
  currentSession = user
  if (user) {
    localStorage.setItem(FAKE_AUTH_SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(FAKE_AUTH_SESSION_KEY)
  }
}

function loadUsers(): Record<string, FakeUserRecord> {
  try {
    return JSON.parse(localStorage.getItem(FAKE_AUTH_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, FakeUserRecord>): void {
  localStorage.setItem(FAKE_AUTH_STORAGE_KEY, JSON.stringify(users))
}

export async function signUp(email: string, password: string): Promise<boolean> {
  const users = loadUsers()
  if (users[email]) {
    const error = new Error('User already exists')
    error.name = 'UsernameExistsException'
    throw error
  }
  users[email] = { password, confirmed: false, userId: crypto.randomUUID() }
  saveUsers(users)
  return true
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  if (!code) throw new Error('confirmation code is required')
  const users = loadUsers()
  const user = users[email]
  if (!user) throw new Error('user not found')
  user.confirmed = true
  saveUsers(users)
}

function requireEmail(email: string): void {
  if (!email) throw new Error('email is required')
}

export async function resendSignUpCode(email: string): Promise<void> {
  requireEmail(email)
}

export async function requestPasswordReset(email: string): Promise<void> {
  requireEmail(email)
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  if (!code) throw new Error('reset code is required')
  const users = loadUsers()
  const user = users[email]
  if (!user) throw new Error('user not found')
  user.password = newPassword
  saveUsers(users)
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const users = loadUsers()
  const user = users[email]
  if (!user || user.password !== password) {
    const error = new Error('sign-in failed')
    error.name = 'NotAuthorizedException'
    throw error
  }
  if (!user.confirmed) {
    const error = new Error('user is not confirmed')
    error.name = 'UserNotConfirmedException'
    throw error
  }
  const signedIn: AuthUser = { userId: user.userId, email }
  saveSession(signedIn)
  return signedIn
}

export async function signOut(): Promise<void> {
  saveSession(null)
}

export async function configureAuth(): Promise<boolean> {
  return true
}

export async function restoreSession(): Promise<AuthUser | null> {
  const session = loadSession()
  if (!session) return null
  const user = session.email ? loadUsers()[session.email] : undefined
  if (!user || !user.confirmed) {
    saveSession(null)
    return null
  }
  const restored: AuthUser = { userId: user.userId, email: session.email }
  saveSession(restored)
  return restored
}
