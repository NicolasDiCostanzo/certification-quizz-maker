<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { texts } from '../texts/en'
import type { Question, QuestionAnswer } from '../types'
import QuestionReviewView from './QuestionReviewView.vue'

const props = defineProps<{
  certCode: string
  topic?: string
  themeGroup?: string
  themeValue?: string
}>()

const route = useRoute()
const { getCert } = useQuizLoader()
const historyStore = useQuizHistoryStore()

const cert = computed(() => getCert(props.certCode))
const entries = computed(() => historyStore.byCertCode(props.certCode))

const isTopicReview = computed(() => route.name === 'topic-review')
const filterValue = computed(() => props.topic ?? props.themeValue ?? '')
const themeGroup = computed(() => props.themeGroup ?? '')

const questions = computed((): Question[] => {
  const seen = new Set<string>()
  const result: Question[] = []
  for (const entry of entries.value) {
    for (const q of entry.questions) {
      const matches = isTopicReview.value
        ? q.topic === filterValue.value
        : (q.themes?.[themeGroup.value] ?? []).includes(filterValue.value)
      if (matches && !seen.has(q.id)) {
        seen.add(q.id)
        result.push(q)
      }
    }
  }
  return result
})

const answers = computed((): Record<string, QuestionAnswer> => {
  const result: Record<string, QuestionAnswer> = {}
  for (const entry of entries.value) {
    for (const [questionId, answer] of Object.entries(entry.answers)) {
      if (questions.value.some((q) => q.id === questionId)) {
        result[questionId] = answer
      }
    }
  }
  return result
})

const title = computed(() =>
  isTopicReview.value
    ? texts.topicReviewTitle(decodeURIComponent(filterValue.value))
    : texts.themeReviewTitle(decodeURIComponent(themeGroup.value), decodeURIComponent(filterValue.value)),
)

const questionsTitle = computed(() =>
  isTopicReview.value
    ? texts.questionsForTopic(decodeURIComponent(filterValue.value))
    : texts.questionsForTheme(decodeURIComponent(filterValue.value)),
)
</script>

<template>
  <QuestionReviewView
    :questions="questions"
    :answers="answers"
    :cert="cert"
    :title="title"
    :questions-title="questionsTitle"
    :back-label="texts.goBackToDashboard"
    :back-route="{ name: 'quiz-dashboard', params: { certCode } }"
  />
</template>