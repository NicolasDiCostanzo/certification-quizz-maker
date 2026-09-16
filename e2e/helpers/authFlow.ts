import { expect, type Page } from '@playwright/test'
import { FAKE_AUTH_STORAGE_KEY } from '../../src/services/auth.fake'
import { texts } from '../../src/texts/en'
import type { TestUser } from './testUser'

export async function seedConfirmedUser(page: Page, { email, password }: TestUser): Promise<void> {
  await page.addInitScript(
    ({ key, email, password }) => {
      const users = JSON.parse(localStorage.getItem(key) ?? '{}')
      if (!users[email]) {
        users[email] = { password, confirmed: true, userId: crypto.randomUUID() }
        localStorage.setItem(key, JSON.stringify(users))
      }
    },
    { key: FAKE_AUTH_STORAGE_KEY, email, password },
  )
}

export async function signIn(page: Page, { email, password }: TestUser): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignInCta }).click()
  await expect(page).toHaveURL(/#\/cert$/)
}

export async function resetPassword(page: Page, { email }: TestUser, newPassword: string): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await expect(page.getByRole('heading', { name: texts.authSignInTitle })).toBeVisible()

  await page.getByRole('button', { name: texts.authSwitchToReset }).click()
  await expect(page.getByRole('heading', { name: texts.authResetTitle })).toBeVisible()

  await page.locator('input[type="email"]').fill(email)
  await page.getByRole('button', { name: texts.authResetCta }).click()
  await expect(page.getByRole('heading', { name: texts.authResetConfirmTitle })).toBeVisible()

  await page.locator('input[autocomplete="one-time-code"]').fill('000000')
  await page.locator('input[autocomplete="new-password"]').fill(newPassword)
  await page.getByRole('button', { name: texts.authResetConfirmCta }).click()

  await expect(page).toHaveURL(/#\/cert$/)
  await expect(page.locator('.account-chip__email')).toHaveText(email)

  await page.getByRole('button', { name: texts.signOut }).click()
  await expect(page).toHaveURL(/\/#\/$/)

  await signIn(page, { email, password: newPassword })
}

export async function resendConfirmationCode(page: Page, { email, password }: TestUser): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeNewAccountCta }).click()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignUpCta }).click()
  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()

  await page.getByRole('button', { name: texts.authResendCode }).click()
  await expect(page.getByText(texts.authCodeResent)).toBeVisible()

  await page.locator('input[autocomplete="one-time-code"]').fill('000000')
  await page.getByRole('button', { name: texts.authConfirmCta }).click()

  await expect(page).toHaveURL(/#\/cert$/)
  await expect(page.locator('.account-chip__email')).toHaveText(email)
}

export async function signUpAndConfirm(page: Page, { email, password }: TestUser): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeNewAccountCta }).click()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignUpCta }).click()

  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()

  await page.locator('input[autocomplete="one-time-code"]').fill('000000')
  await page.getByRole('button', { name: texts.authConfirmCta }).click()

  await expect(page).toHaveURL(/#\/cert$/)
}
