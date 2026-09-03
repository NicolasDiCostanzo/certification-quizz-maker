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

const { getCert } = useQuizLoader()
const historyStore = useQuizHistoryStore()

const cert = computed(() => getCert(props.certCode))
const entry = computed(() => historyStore.entries.find((e) => e.id === props.entryId))

const result = computed(() => entry.value?.result)
const answers = computed(() => entry.value?.answers ?? {})
const questions = computed(() => entry.value?.questions ?? [])

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
</template>
