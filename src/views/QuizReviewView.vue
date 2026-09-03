<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ReviewBreakdown from '../components/ReviewBreakdown.vue'
import ReviewDetailPanel from '../components/ReviewDetailPanel.vue'
import ReviewQuestionGrid from '../components/ReviewQuestionGrid.vue'
import ReviewScoreCard from '../components/ReviewScoreCard.vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import { texts } from '../texts/en'
import { breakdownByTheme, breakdownByTopic } from '../utils/scoreBreakdown'

const router = useRouter()
const sessionStore = useQuizSessionStore()
const { getCert } = useQuizLoader()

const certCode = computed(() => session.value?.certCode ?? '')
const cert = computed(() => getCert(certCode.value))
const session = computed(() => sessionStore.currentSession)
const result = computed(() => session.value?.result)

const selectedQuestionId = ref<string | null>(null)

const answers = computed(() => session.value?.answers ?? {})
const questions = computed(() => session.value?.questions ?? [])

watch(questions, (qs) => {
  if (selectedQuestionId.value === null && qs.length > 0) {
    selectedQuestionId.value = qs[0].id
  }
}, { immediate: true })

const passingPercent = computed(() => {
  const ps = cert.value?.exam.passingScore
  if (!ps) return 0
  return ps.scale ? Math.round((ps.passingScore / ps.scale) * 100) : ps.passingScore
})

const topicBreakdown = computed(() =>
  breakdownByTopic(questions.value, answers.value),
)

const themeGroups = computed(() => Object.keys(cert.value?.themes ?? {}))

const themeBreakdown = computed(() =>
  breakdownByTheme(questions.value, answers.value, themeGroups.value),
)

const selectedQuestion = computed(() =>
  questions.value.find((q) => q.id === selectedQuestionId.value) ?? null,
)

const selectedAnswer = computed(() =>
  selectedQuestionId.value ? answers.value[selectedQuestionId.value] : null,
)

function toggleSelected(questionId: string) {
  selectedQuestionId.value = selectedQuestionId.value === questionId ? null : questionId
}

function goHome() {
  sessionStore.resetSession()
  router.push({ name: 'cert-selector' })
}
</script>

<template>
  <div v-if="session && result" class="review">
    <header class="review__header">
      <h1>{{ texts.reviewTitle }}</h1>
      <div class="banner" :class="result.passed ? 'banner--passed' : 'banner--failed'">
        {{ result.passed ? texts.passed : texts.failed }}
      </div>
      <ReviewScoreCard :result="result" :cert="cert" />
    </header>

    <ReviewBreakdown
      :topic-breakdown="topicBreakdown"
      :theme-breakdown="themeBreakdown"
      :theme-groups="themeGroups"
      :passing-percent="passingPercent"
    />

    <ReviewQuestionGrid
      :questions="questions"
      :answers="answers"
      :cert-code="certCode"
      :selected-question-id="selectedQuestionId"
      @select="toggleSelected"
    />

    <ReviewDetailPanel
      :question="selectedQuestion"
      :answer="selectedAnswer"
      :cert-code="certCode"
      :theme-groups="themeGroups"
    />

    <footer class="review__footer">
      <button type="button" class="cta" @click="goHome">{{ texts.backToHomeCta }}</button>
    </footer>
  </div>
</template>

<style scoped>
.review {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.review__header {
  margin-bottom: 24px;
}

.review__header h1 {
  margin: 0 0 16px;
  font-size: 28px;
  color: var(--text-h);
}

.banner {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}

.banner--passed {
  background: color-mix(in srgb, var(--green) 15%, var(--surface));
  color: var(--green);
  border: 1px solid var(--green);
}

.banner--failed {
  background: color-mix(in srgb, var(--red) 15%, var(--surface));
  color: var(--red);
  border: 1px solid var(--red);
}

.review__footer {
  display: flex;
  justify-content: center;
}

.cta {
  padding: 12px 24px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.cta:hover {
  opacity: 0.9;
}
</style>
