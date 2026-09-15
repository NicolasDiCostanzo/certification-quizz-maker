import { expect, type Page } from '@playwright/test'
import { texts } from '../../src/texts/en'
import { confirmTestUser, type TestUser } from './cognitoTestUser'

export async function signUpAndConfirm(page: Page, { email, password }: TestUser): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeNewAccountCta }).click()

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: texts.authSignUpCta }).click()

  await expect(page.getByRole('heading', { name: texts.authConfirmTitle })).toBeVisible()

  await confirmTestUser(email)
}

export async function signUpConfirmAndSignIn(page: Page, user: TestUser): Promise<void> {
  await signUpAndConfirm(page, user)

  await page.goto('/')
  await page.getByRole('button', { name: texts.welcomeExistingAccountCta }).click()
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.getByRole('button', { name: texts.authSignInCta }).click()

  await expect(page).toHaveURL(/#\/cert$/)
}
