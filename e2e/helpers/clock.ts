import type { Page } from '@playwright/test'

export async function freezeTimeAt(page: Page, date: Date): Promise<void> {
  await page.clock.setFixedTime(date)
}
