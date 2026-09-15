import { expect, type Page } from '@playwright/test'
import { texts } from '../../src/texts/en'

export async function pinDeterministicShuffle(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => 0.999999
  })
}

async function expandSection(page: Page, summaryText: string): Promise<void> {
  await page.locator('summary').filter({ hasText: summaryText }).click()
}

export async function configureFilteredQuiz(
  page: Page,
  { topic, themeGroup, themeValues }: { topic: string; themeGroup: string; themeValues: string[] },
): Promise<void> {
  await expandSection(page, texts.filterQuestionsLabel)
  await page.getByLabel(topic, { exact: true }).check()

  await expandSection(page, texts.includeLabel)
  const group = page.getByRole('group', { name: themeGroup })
  await group.getByLabel(texts.matchAll, { exact: true }).check()
  for (const value of themeValues) {
    await group.getByLabel(value, { exact: true }).check()
  }
}

export async function expectMatchingCount(page: Page, count: number): Promise<void> {
  await expect(page.locator('.match-preview')).toHaveText(texts.matchingCountValue(count))
}

export async function startConfiguredQuiz(page: Page): Promise<void> {
  await page.getByRole('button', { name: texts.startQuizCta }).click()
}

export async function selectAnswer(page: Page, letters: string[]): Promise<void> {
  for (const letter of letters) {
    await page.locator(`.options input[value="${letter}"]`).check()
  }
}

export async function submitAnswer(page: Page): Promise<void> {
  await page.getByRole('button', { name: texts.submit }).click()
}

export async function expectCorrectFeedback(page: Page): Promise<void> {
  await expect(page.locator('.feedback-badge')).toHaveText(texts.correct)
}

export async function expectIncorrectFeedback(page: Page, correctAnswers: string[]): Promise<void> {
  await expect(page.locator('.feedback-badge')).toHaveText(texts.incorrect)
  await expect(page.locator('.feedback-explanation')).toContainText(`${texts.correctAnswer}: ${correctAnswers.join(', ')}`)
}

export async function flagQuestion(page: Page): Promise<void> {
  await page.getByRole('button', { name: texts.flag, exact: true }).click()
}

export async function unflagQuestion(page: Page): Promise<void> {
  await page.getByRole('button', { name: texts.unflag, exact: true }).click()
}

export async function goToNextQuestion(page: Page): Promise<void> {
  await page.getByRole('button', { name: texts.next, exact: true }).click()
}

export async function finishQuiz(page: Page): Promise<void> {
  await page.getByRole('button', { name: texts.finish, exact: true }).click()
}

export async function expectDashboardStat(page: Page, label: string, value: string): Promise<void> {
  await expect(page.locator('.stat', { hasText: label }).locator('.stat-value')).toHaveText(value)
}
