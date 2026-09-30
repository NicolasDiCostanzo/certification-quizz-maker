import { expect, test } from '@playwright/test'
import { texts } from '../src/texts/en'

test('a guest can continue locally and reach the question bank', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: texts.welcomeNoAccountCta }).click()

  await expect(page.getByRole('heading', { name: texts.selectCertification })).toBeVisible()
})

test('an unknown path shows the 404 page and can get back to the welcome screen', async ({ page }) => {
  await page.goto('/this/page/does-not-exist')

  await expect(page.getByRole('heading', { name: texts.notFoundTitle })).toBeVisible()
  await expect(page.locator('.not-found__path code')).toHaveText('/this/page/does-not-exist')

  await page.getByRole('button', { name: texts.notFoundHomeCta }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: texts.welcomeIntroTitle })).toBeVisible()
})