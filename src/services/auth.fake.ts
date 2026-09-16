import type { AuthUser } from '../types'

export const FAKE_AUTH_STORAGE_KEY = 'e2e-fake-auth-users'

interface FakeUserRecord {
  password: string
  confirmed: boolean
  userId: string
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
  if (!user || !user.confirmed || user.password !== password) {
    throw new Error('sign-in failed')
  }
  return { userId: user.userId, email }
}

export async function signOut(): Promise<void> {}

export async function configureAuth(): Promise<boolean> {
  return true
}
