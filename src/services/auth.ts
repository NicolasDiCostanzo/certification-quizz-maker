import type { AuthUser } from '../types'

export async function signUp(email: string, password: string): Promise<boolean> {
  const { signUp: amplifySignUp } = await import('aws-amplify/auth')
  const { isSignUpComplete } = await amplifySignUp({
    username: email,
    password,
    options: { userAttributes: { email } },
  })
  return !isSignUpComplete
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  const { confirmSignUp: amplifyConfirmSignUp } = await import('aws-amplify/auth')
  await amplifyConfirmSignUp({ username: email, confirmationCode: code })
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { fetchUserAttributes, getCurrentUser, signIn: amplifySignIn } = await import('aws-amplify/auth')
  const { isSignedIn } = await amplifySignIn({ username: email, password })
  if (!isSignedIn) throw new Error('sign-in did not complete')
  const { userId } = await getCurrentUser()
  const attributes = await fetchUserAttributes()
  return { userId, email: attributes.email ?? null }
}

export async function configureAuth(userPoolId: string, userPoolClientId: string): Promise<boolean> {
  try {
    const { Amplify } = await import('aws-amplify')
    Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId } } })
    return true
  } catch {
    return false
  }
}

export async function checkSessionStatus(): Promise<'valid' | 'invalid' | 'unknown'> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth')
    const { tokens } = await fetchAuthSession()
    return tokens ? 'valid' : 'invalid'
  } catch {
    return navigator.onLine ? 'invalid' : 'unknown'
  }
}

export async function signOut(): Promise<void> {
  const { signOut: amplifySignOut } = await import('aws-amplify/auth')
  await amplifySignOut()
}