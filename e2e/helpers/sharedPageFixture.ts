import { test as base, type Page } from '@playwright/test'

export const test = base.extend<object, { sharedPage: Page }>({
  sharedPage: [
    async ({ browser }, use) => {
      const page = await browser.newPage({ locale: 'en-US', timezoneId: 'UTC' })
      await use(page)
      await page.close()
    },
    { scope: 'worker' },
  ],
})

export { expect } from '@playwright/test'
