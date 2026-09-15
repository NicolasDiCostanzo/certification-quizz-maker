import { texts } from '../src/texts/en'
import {
  certCode,
  certExamName,
  expectedResult,
  scriptedQuestions,
  themeBreakdown,
  themeGroup,
  themeGroupsInOrder,
  themeValues,
  topicBreakdown,
  topicFilter,
} from './fixtures/deploymentQuiz'
import { signUpConfirmAndSignIn } from './helpers/authFlow'
import { authEnabled, authSkipReason, deleteTestUser, newTestUserCredentials } from './helpers/cognitoTestUser'
import {
  configureFilteredQuiz,
  expectCorrectFeedback,
  expectDashboardStat,
  expectIncorrectFeedback,
  expectMatchingCount,
  finishQuiz,
  flagQuestion,
  goToNextQuestion,
  pinDeterministicShuffle,
  selectAnswer,
  startConfiguredQuiz,
  submitAnswer,
  unflagQuestion,
} from './helpers/quiz'
import {
  expandThemeGroup,
  expectPassFailBanner,
  expectQuestionDetail,
  expectScoreCard,
  expectSummaryCard,
  expectThemeBreakdownRow,
  expectTopicBreakdownRow,
  openQuestionDetail,
} from './helpers/review'
import { expect, test } from './helpers/sharedPageFixture'

test.skip(!authEnabled, authSkipReason)

const { email, password } = newTestUserCredentials()

test.describe.serial('quiz journey on the DVA-C02 certification', () => {
  test.beforeAll(async ({ sharedPage: page }) => {
    await pinDeterministicShuffle(page)
    await signUpConfirmAndSignIn(page, { email, password })
  })

  test.afterAll(async () => {
    await deleteTestUser(email)
  })

  test('lists every declared certification as a card', async ({ sharedPage: page }) => {
    await page.goto('/#/cert')
    await expect(page.locator('.cert-card')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: certExamName })).toBeVisible()
  })

  test('shows a blank dashboard before any quiz is taken', async ({ sharedPage: page }) => {
    await page.getByRole('heading', { name: certExamName }).click()
    await expect(page).toHaveURL(new RegExp(`#/certs/${certCode}$`))

    await expectDashboardStat(page, texts.quizzesTaken, '0')
    await expectDashboardStat(page, texts.overallAccuracy, '0%')
    await expectDashboardStat(page, texts.correctAnswers, '0 / 0')
    await expect(page.getByText(texts.noQuizzesTaken)).toBeVisible()
  })

  test('configures a quiz filtered down to the 4 scripted questions', async ({ sharedPage: page }) => {
    await page.getByRole('button', { name: texts.startQuizCta }).click()
    await configureFilteredQuiz(page, { topic: topicFilter, themeGroup, themeValues })
    await expectMatchingCount(page, scriptedQuestions.length)

    await startConfiguredQuiz(page)
    await expect(page.locator('.progress-text')).toHaveText(texts.questionOf(1, scriptedQuestions.length))
  })

  test('answers all 4 questions with the scripted correct/incorrect results', async ({ sharedPage: page }) => {
    const [q1, q2, q3, q4] = scriptedQuestions

    await selectAnswer(page, q1.selectAnswers)
    await flagQuestion(page)
    await submitAnswer(page)
    await expectCorrectFeedback(page)
    await goToNextQuestion(page)

    await selectAnswer(page, q2.selectAnswers)
    await flagQuestion(page)
    await unflagQuestion(page)
    await submitAnswer(page)
    await expectCorrectFeedback(page)
    await goToNextQuestion(page)

    await selectAnswer(page, q3.selectAnswers)
    await submitAnswer(page)
    await expectIncorrectFeedback(page, q3.correctAnswers)
    await goToNextQuestion(page)

    await selectAnswer(page, q4.selectAnswers)
    await submitAnswer(page)
    await expectIncorrectFeedback(page, q4.correctAnswers)
    await finishQuiz(page)

    await expect(page).toHaveURL(new RegExp(`#/certs/${certCode}/quiz/review$`))
  })

  test('shows the pass/fail banner and score card', async ({ sharedPage: page }) => {
    await expectPassFailBanner(page, expectedResult.passed)
    await expectScoreCard(page, {
      percent: expectedResult.percent,
      correctCount: expectedResult.correctCount,
      totalAnswered: expectedResult.totalQuestions,
      projectedScore: expectedResult.projectedScore,
      scale: expectedResult.scale,
    })
  })

  test('shows the score by topic and score by theme breakdown', async ({ sharedPage: page }) => {
    for (const row of topicBreakdown) {
      await expectTopicBreakdownRow(page, row)
    }

    await expect(page.locator('.breakdown__group-label')).toHaveText(themeGroupsInOrder)

    for (const group of themeGroupsInOrder) {
      await expandThemeGroup(page, group)
      for (const row of themeBreakdown[group]) {
        await expectThemeBreakdownRow(page, group, row)
      }
    }
  })

  test('shows the 4 summary cards with the scripted correctness and flag state', async ({ sharedPage: page }) => {
    for (const [i, question] of scriptedQuestions.entries()) {
      await expectSummaryCard(page, i + 1, { correct: question.correct, flagged: question.flaggedAfterQuiz })
    }
  })

  test('shows full question detail per card, then unflags the first and flags the last', async ({ sharedPage: page }) => {
    await expectQuestionDetail(page, topicFilter, scriptedQuestions[0])
    for (const [i, question] of scriptedQuestions.entries()) {
      if (i === 0) continue
      await openQuestionDetail(page, i + 1)
      await expectQuestionDetail(page, topicFilter, question)
    }

    await openQuestionDetail(page, 1)
    await unflagQuestion(page)
    await openQuestionDetail(page, 4)
    await flagQuestion(page)

    await expectSummaryCard(page, 1, { correct: true, flagged: false })
    await expectSummaryCard(page, 4, { correct: false, flagged: true })
  })
})
