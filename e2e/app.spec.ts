import { expect, test } from '@playwright/test'
import { readFileSync } from 'fs'
import { texts } from '../src/texts/en'

function isAuthConfiguredInBuild(): boolean {
  // Vite auto-loads .env.local at build time and bakes the values into
  // import.meta.env. The Playwright test worker does NOT load .env.local
  // into process.env, so we read it directly to know whether the preview
  // server we are testing against has auth enabled.
  try {
    const text = readFileSync('.env.local', 'utf8')
    const poolId = text.match(/VITE_COGNITO_USER_POOL_ID=(.*)/)?.[1].trim()
    const clientId = text.match(/VITE_COGNITO_CLIENT_ID=(.*)/)?.[1].trim()
    return !!(poolId && clientId)
  } catch {
    return false
  }
}

test('a guest can continue locally and reach the question bank', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: texts.welcomeNoAccountCta }).click()

  await expect(page.getByRole('heading', { name: texts.selectCertification })).toBeVisible()
})

test('deep-linking /auth falls back to the welcome screen while authentication is not configured', async ({ page }) => {
  test.skip(isAuthConfiguredInBuild(), 'auth is configured in this build; /auth is a real route here')
  test.skip(process.env.E2E_MODE === 'auth', 'authentication is baked into this build')

  await page.goto('/#/auth')

  await expect(page).toHaveURL('/#/')
})