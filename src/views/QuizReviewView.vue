<script setup lang="ts">
import { computed } from 'vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import { texts } from '../texts/en'
import { breakdownByTheme, breakdownByTopic } from '../utils/scoreBreakdown'
import QuestionReviewView from './QuestionReviewView.vue'

const sessionStore = useQuizSessionStore()
const { getCert } = useQuizLoader()

const session = computed(() => sessionStore.currentSession)
const certCode = computed(() => session.value?.certCode ?? '')
const cert = computed(() => getCert(certCode.value))
const result = computed(() => session.value?.result)
const answers = computed(() => session.value?.answers ?? {})
const questions = computed(() => session.value?.questions ?? [])

const themeGroups = computed(() => Object.keys(cert.value?.themes ?? {}))
const topicBreakdown = computed(() => breakdownByTopic(questions.value, answers.value))
const themeBreakdown = computed(() => breakdownByTheme(questions.value, answers.value, themeGroups.value))

function resetSession() {
  sessionStore.resetSession()
}
</script>

<template>
  <QuestionReviewView
    :questions="questions"
    :answers="answers"
    :cert="cert"
    :title="texts.reviewTitle"
    :show-summary="true"
    :summary-result="result"
    :topic-breakdown="topicBreakdown"
    :theme-breakdown="themeBreakdown"
    :back-route="{ name: 'cert-selector' }"
    :back-label="texts.backToHomeCta"
    :before-back="resetSession"
  />
</template>
