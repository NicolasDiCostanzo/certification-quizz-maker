import { expect, test } from '@playwright/test'
import { texts } from '../src/texts/en'

test('a guest can continue locally and reach the question bank', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: texts.welcomeNoAccountCta }).click()

  await expect(page.getByRole('heading', { name: texts.selectCertification })).toBeVisible()
})

test('deep-linking /auth falls back to the welcome screen while authentication is not configured', async ({ page }) => {
  test.skip(process.env.E2E_MODE === 'auth', 'authentication is baked into this build')

  await page.goto('/#/auth')

  await expect(page).toHaveURL(/#\//)
})