import { texts } from '../src/texts/en'
import { authEnabled, authSkipReason, deleteTestUser, newTestUserCredentials } from './helpers/cognitoTestUser'
import { signUpConfirmAndSignIn } from './helpers/authFlow'
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
import { certCode, certExamName, scriptedQuestions, themeGroup, themeValues, topicFilter } from './fixtures/deploymentQuiz'
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
})
