import { createRouter, createWebHashHistory } from 'vue-router'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import { useUserPreferencesStore } from '../stores/userPreferences'
import CertSelectorView from '../views/CertSelectorView.vue'
import QuizConfigureView from '../views/QuizConfigureView.vue'
import QuizDashboardView from '../views/QuizDashboardView.vue'
import QuizHistoryReviewView from '../views/QuizHistoryReviewView.vue'
import QuizReviewView from '../views/QuizReviewView.vue'
import QuizSessionView from '../views/QuizSessionView.vue'
import QuestionBankReviewView from '../views/QuestionBankReviewView.vue'
import WelcomeView from '../views/WelcomeView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'cert-selector', component: CertSelectorView },
    { path: '/welcome', name: 'welcome', component: WelcomeView },
    { path: '/certs/:certCode', name: 'quiz-dashboard', component: QuizDashboardView, props: true },
    { path: '/certs/:certCode/configure', name: 'quiz-configure', component: QuizConfigureView },
    { path: '/certs/:certCode/quiz', name: 'quiz-session', component: QuizSessionView },
    { path: '/certs/:certCode/quiz/review', name: 'quiz-review', component: QuizReviewView },
    { path: '/certs/:certCode/history/:entryId', name: 'quiz-history-review', component: QuizHistoryReviewView, props: true },
    { path: '/certs/:certCode/topic/:topic', name: 'topic-review', component: QuestionBankReviewView, props: true },
    { path: '/certs/:certCode/theme/:themeGroup/:themeValue', name: 'theme-review', component: QuestionBankReviewView, props: true },
    { path: '/certs/:certCode/flagged', name: 'flagged-review', component: QuestionBankReviewView, props: true },
  ],
})

const { getCert } = useQuizLoader()

router.beforeEach((to) => {
  const certCode = to.params.certCode
  if (typeof certCode === 'string' && !getCert(certCode)) {
    return { name: 'cert-selector' }
  }
})

router.beforeEach((to) => {
  if (to.name !== 'cert-selector') return
  if (useUserPreferencesStore().accountMode) return
  return { name: 'welcome' }
})

router.beforeEach((to) => {
  if (to.name !== 'quiz-session' && to.name !== 'quiz-review') return
  const session = useQuizSessionStore()
  if (!session.hasSession || session.currentSession?.certCode !== to.params.certCode) {
    return { name: 'quiz-configure', params: { certCode: to.params.certCode } }
  }
})