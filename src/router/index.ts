import { createRouter, createWebHashHistory } from 'vue-router'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import CertSelectorView from '../views/CertSelectorView.vue'
import QuizConfigureView from '../views/QuizConfigureView.vue'
import QuizReviewView from '../views/QuizReviewView.vue'
import QuizSessionView from '../views/QuizSessionView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'cert-selector', component: CertSelectorView },
    { path: '/certs/:certCode/configure', name: 'quiz-configure', component: QuizConfigureView },
    { path: '/certs/:certCode/quiz', name: 'quiz-session', component: QuizSessionView },
    { path: '/certs/:certCode/quiz/review', name: 'quiz-review', component: QuizReviewView },
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
  if (to.name !== 'quiz-session' && to.name !== 'quiz-review') return
  const session = useQuizSessionStore()
  if (!session.hasSession || session.currentSession?.certCode !== to.params.certCode) {
    return { name: 'quiz-configure', params: { certCode: to.params.certCode } }
  }
})