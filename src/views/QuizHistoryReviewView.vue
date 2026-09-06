<script setup lang="ts">
import { computed } from 'vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { texts } from '../texts/en'
import { breakdownByTheme, breakdownByTopic } from '../utils/scoreBreakdown'
import QuestionReviewView from './QuestionReviewView.vue'

const props = defineProps<{
  certCode: string
  entryId: string
}>()

const { getCert, resolveQuestions } = useQuizLoader()
const historyStore = useQuizHistoryStore()

const cert = computed(() => getCert(props.certCode))
const entry = computed(() => historyStore.entries.find((e) => e.id === props.entryId))

const result = computed(() => entry.value?.result)
const answers = computed(() => entry.value?.answers ?? {})
const questions = computed(() => resolveQuestions(props.certCode, entry.value?.questionIds ?? []))

const topicBreakdown = computed(() =>
  breakdownByTopic(questions.value, answers.value),
)

const themeGroups = computed(() => Object.keys(cert.value?.themes ?? {}))

const themeBreakdown = computed(() =>
  breakdownByTheme(questions.value, answers.value, themeGroups.value),
)
</script>

<template>
  <QuestionReviewView
    v-if="entry && result"
    :questions="questions"
    :answers="answers"
    :cert="cert"
    :title="texts.reviewTitle"
    :show-summary="true"
    :summary-result="result"
    :topic-breakdown="topicBreakdown"
    :theme-breakdown="themeBreakdown"
    :back-route="{ name: 'quiz-dashboard', params: { certCode } }"
  />
  <div v-else class="not-found">
    <p>{{ texts.quizNotFoundMessage }}</p>
    <router-link :to="{ name: 'quiz-dashboard', params: { certCode } }" class="btn">
      {{ texts.goBackToDashboard }}
    </router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  padding: 2rem;
}

.not-found p {
  color: var(--text);
  font-size: 1.125rem;
}
</style>
