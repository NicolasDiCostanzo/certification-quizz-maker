export interface AwsConfig {
  region: string | undefined
  userPoolId: string | undefined
  userPoolClientId: string | undefined
  syncApiUrl: string | undefined
}

function readEnv(name: string): string | undefined {
  const value = import.meta.env[name]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const awsConfig: AwsConfig = {
  region: readEnv('VITE_AWS_REGION'),
  userPoolId: readEnv('VITE_COGNITO_USER_POOL_ID'),
  userPoolClientId: readEnv('VITE_COGNITO_CLIENT_ID'),
  syncApiUrl: readEnv('VITE_SYNC_API_URL'),
}

export function isAuthConfigured(): boolean {
  return awsConfig.userPoolId !== undefined && awsConfig.userPoolClientId !== undefined
}