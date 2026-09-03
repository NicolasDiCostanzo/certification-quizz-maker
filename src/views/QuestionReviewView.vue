<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ReviewDetailPanel from '../components/ReviewDetailPanel.vue'
import ReviewQuestionGrid from '../components/ReviewQuestionGrid.vue'
import ReviewSummary from '../components/ReviewSummary.vue'
import { texts } from '../texts/en'
import type { CertBundle, Question, QuestionAnswer } from '../types'

const props = defineProps<{
  questions: Question[]
  answers: Record<string, QuestionAnswer>
  cert: CertBundle | undefined
  title: string
  showSummary?: boolean
  summaryResult?: { percentCorrect: number; passed: boolean; timesCorrect: number; totalAnswered: number; projectedScaledScore?: number }
  topicBreakdown?: { label: string; correct: number; total: number; percent: number }[]
  themeBreakdown?: { group: string; value: string; correct: number; total: number; percent: number }[]
  backRoute: { name: string; params?: Record<string, string> }
  questionsTitle?: string
  backLabel?: string
}>()

const router = useRouter()

const themeGroups = computed(() => Object.keys(props.cert?.themes ?? {}))

const selectedQuestionId = ref<string | null>(null)

watch(() => props.questions, (qs) => {
  if (selectedQuestionId.value === null && qs.length > 0) {
    selectedQuestionId.value = qs[0].id
  }
}, { immediate: true })

const passingPercent = computed(() => {
  const ps = props.cert?.exam.passingScore
  if (!ps) return 0
  return ps.scale ? Math.round((ps.passingScore / ps.scale) * 100) : ps.passingScore
})

const selectedQuestion = computed(() =>
  props.questions.find((q) => q.id === selectedQuestionId.value) ?? null,
)

const selectedAnswer = computed(() =>
  selectedQuestionId.value ? props.answers[selectedQuestionId.value] : null,
)

function toggleSelected(questionId: string) {
  selectedQuestionId.value = selectedQuestionId.value === questionId ? null : questionId
}

function goBack() {
  router.push(props.backRoute)
}
</script>

<template>
  <div v-if="questions.length > 0" class="review">
    <header class="review__header">
    <button type="button" class="cta" @click="goBack">{{ backLabel ?? texts.backToDashboardCta }}</button>
      <h1>{{ title }}</h1>
    </header>

    <ReviewSummary
      v-if="showSummary && summaryResult"
      :result="summaryResult"
      :cert="cert"
      :topic-breakdown="topicBreakdown ?? []"
      :theme-breakdown="themeBreakdown ?? []"
      :theme-groups="themeGroups"
      :passing-percent="passingPercent"
    />

    <ReviewQuestionGrid
      :questions="questions"
      :answers="answers"
      :cert-code="cert?.exam.code ?? ''"
      :selected-question-id="selectedQuestionId"
      :title="questionsTitle"
      @select="toggleSelected"
    />

    <ReviewDetailPanel
      :question="selectedQuestion"
      :answer="selectedAnswer"
      :cert-code="cert?.exam.code ?? ''"
      :theme-groups="themeGroups"
    />

  </div>

  <div v-else class="review review--not-found">
    <header class="review__header">
      <h1>{{ texts.quizNotFoundTitle }}</h1>
    </header>
    <p class="review__message">{{ texts.noQuestionsFoundMessage }}</p>
    <footer class="review__footer">
      <button type="button" class="cta" @click="goBack">{{ backLabel ?? texts.backToDashboardCta }}</button>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.review__header h1 {
  margin: 0;
  font-size: 28px;
  color: var(--text-h);
}

.review__footer {
  display: flex;
  justify-content: center;
}

.cta {
  padding: 12px 24px;
  color: var(--cta-text);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.cta:hover {
  opacity: 0.9;
}

.review--not-found {
  text-align: center;
}

.review--not-found .review__header {
  margin-bottom: 16px;
}

.review__message {
  color: var(--text);
  margin-bottom: 24px;
}
</style>