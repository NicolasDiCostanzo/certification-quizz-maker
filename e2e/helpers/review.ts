import { expect, type Locator, type Page } from '@playwright/test'
import { texts } from '../../src/texts/en'
import type { BreakdownRow, ScriptedQuestion } from '../fixtures/deploymentQuiz'

function percentOf(row: BreakdownRow): number {
  return row.total === 0 ? 0 : Math.round((row.correct / row.total) * 100)
}

function exact(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
}

export async function expectPassFailBanner(page: Page, passed: boolean): Promise<void> {
  await expect(page.locator('.banner')).toHaveText(passed ? texts.passed : texts.failed)
}

export async function expectScoreCard(
  page: Page,
  { percent, correctCount, totalAnswered, projectedScore, scale }: {
    percent: number
    correctCount: number
    totalAnswered: number
    projectedScore: number
    scale: number
  },
): Promise<void> {
  await expect(page.locator('.score-card__percent')).toHaveText(`${percent}%`)
  await expect(page.locator('.score-card__detail p').first()).toHaveText(texts.correctCount(correctCount, totalAnswered))
  await expect(page.locator('.score-card__scaled')).toHaveText(texts.projectedScaledScore(projectedScore, scale))
}

export async function expectTopicBreakdownRow(page: Page, row: BreakdownRow): Promise<void> {
  const section = page.locator('section.breakdown').filter({
    has: page.getByRole('heading', { name: texts.scoreBreakdownByTopic, exact: true }),
  })
  const rowLocator = section.locator('.breakdown__row').filter({
    has: page.locator('.breakdown__label').filter({ hasText: exact(row.label) }),
  })
  await expect(rowLocator.locator('.breakdown__fraction')).toHaveText(`${row.correct} / ${row.total}`)
  await expect(rowLocator.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', String(percentOf(row)))
}

function themeGroupBlock(page: Page, group: string): Locator {
  return page.locator('.breakdown__group').filter({
    has: page.locator('.breakdown__group-label').filter({ hasText: exact(group) }),
  })
}

export async function expandThemeGroup(page: Page, group: string): Promise<void> {
  await themeGroupBlock(page, group).locator('.breakdown__group-toggle').click()
}

export async function expectThemeBreakdownRow(page: Page, group: string, row: BreakdownRow): Promise<void> {
  const rowLocator = themeGroupBlock(page, group).locator('.breakdown__row').filter({
    has: page.locator('.breakdown__label').filter({ hasText: exact(row.label) }),
  })
  await expect(rowLocator.locator('.breakdown__fraction')).toHaveText(`${row.correct} / ${row.total}`)
  await expect(rowLocator.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', String(percentOf(row)))
}

function summaryCard(page: Page, index: number): Locator {
  return page.locator('.summary-card').nth(index - 1)
}

export async function expectSummaryCard(
  page: Page,
  index: number,
  { correct, flagged }: { correct: boolean; flagged: boolean },
): Promise<void> {
  const card = summaryCard(page, index)
  await expect(card).toHaveAttribute('data-correct', String(correct))
  await expect(card).toHaveAttribute('data-flagged', String(flagged))
}

export async function openQuestionDetail(page: Page, index: number): Promise<void> {
  await summaryCard(page, index).click()
}

export async function expectQuestionDetail(page: Page, topic: string, question: ScriptedQuestion): Promise<void> {
  const panel = page.locator('.detail-panel')

  await expect(panel.locator('.detail-panel__question')).toHaveText(question.questionText)
  await expect(panel.getByText(`${texts.topic}: ${topic}`, { exact: true })).toBeVisible()
  for (const [group, values] of Object.entries(question.themes)) {
    await expect(panel.getByText(texts.themeGroupDisplay(group, values), { exact: true })).toBeVisible()
  }
  await expect(panel.locator('.detail-options .option')).toHaveCount(question.optionsCount)

  await expect(panel.locator('.status-badge')).toHaveText(question.correct ? texts.correct : texts.incorrect)
  const statusParagraphs = panel.locator('.detail-panel__status p')
  await expect(statusParagraphs.first()).toHaveText(`${texts.yourAnswer}: ${question.selectAnswers.join(', ')}`)
  if (!question.correct) {
    await expect(statusParagraphs.nth(1)).toHaveText(`${texts.correctAnswer}: ${question.correctAnswers.join(', ')}`)
  }
}
