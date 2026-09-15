import { expect, test } from '@playwright/test'
import { texts } from '../src/texts/en'

test('a guest can continue locally and reach the question bank', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: texts.welcomeNoAccountCta }).click()

  await expect(page.getByRole('heading', { name: texts.selectCertification })).toBeVisible()
})