<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserProgressStore } from '../stores/userProgress'
import { texts } from '../texts/en'
import { passingScorePercent } from '../utils/examDisplay'
import { breakdownByThemeAllTime, breakdownByTopicAllTime } from '../utils/scoreBreakdown'

import ConfirmModal from '../components/ConfirmModal.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
import QuizHistoryList from '../components/QuizHistoryList.vue'
import ReviewBreakdown from '../components/ReviewBreakdown.vue'
import SecondaryButton from '../components/SecondaryButton.vue'

const props = defineProps<{
  certCode: string
}>()

const router = useRouter()
const { getCert } = useQuizLoader()
const historyStore = useQuizHistoryStore()
const progressStore = useUserProgressStore()

const cert = computed(() => getCert(props.certCode))
const entries = computed(() => historyStore.byCertCode(props.certCode))

const allTimeCorrect = computed(() => historyStore.allTimeCorrect(props.certCode))
const allTimeAttempted = computed(() => historyStore.allTimeAttempted(props.certCode))
const allTimePercent = computed(() =>
  allTimeAttempted.value === 0 ? 0 : Math.round((allTimeCorrect.value / allTimeAttempted.value) * 100),
)

const topicBreakdown = computed(() => breakdownByTopicAllTime(entries.value))
const themeGroups = computed(() => Object.keys(cert.value?.themes ?? {}))
const themeBreakdown = computed(() => breakdownByThemeAllTime(entries.value, themeGroups.value))

const hasFlaggedQuestions = computed(() => progressStore.hasFlagged(props.certCode))

const passingPercent = computed(() => {
  const ps = cert.value?.exam.passingScore
  return ps ? passingScorePercent(ps) : 0
})



const deleteTargetId = ref<string | null>(null)
const showResetModal = ref(false)

function requestDelete(id: string) {
  deleteTargetId.value = id
}

function confirmDelete() {
  if (deleteTargetId.value) {
    historyStore.deleteById(deleteTargetId.value)
    deleteTargetId.value = null
  }
}

function confirmReset() {
  historyStore.resetByCertCode(props.certCode)
  progressStore.resetByCertCode(props.certCode)
  showResetModal.value = false
}

function startQuiz() {
  router.push({ name: 'quiz-configure', params: { certCode: props.certCode } })
}

function goHome() {
  router.push({ name: 'cert-selector' })
}
</script>

<template>
  <div v-if="cert" class="dashboard">
    <header class="dashboard__header">
      <div class="header-buttons">
        <PrimaryButton size="sm" @click="goHome">{{ texts.backToHomeCta }}</PrimaryButton>
        <PrimaryButton size="sm" @click="startQuiz">{{ texts.startQuizCta }}</PrimaryButton>
      </div>
      <h1>{{ cert.exam.name }}</h1>
    </header>

    <section class="all-time">
      <h2>{{ texts.allTimeScore }}</h2>
      <div class="all-time-stats">
        <div class="stat">
          <span class="stat-value">{{ entries.length }}</span>
          <span class="stat-label">{{ texts.quizzesTaken }}</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ allTimePercent }}%</span>
          <span class="stat-label">{{ texts.overallAccuracy }}</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ allTimeCorrect }} / {{ allTimeAttempted }}</span>
          <span class="stat-label">{{ texts.correctAnswers }}</span>
        </div>
      </div>
    </section>

    <ReviewBreakdown
      v-if="entries.length > 0 || hasFlaggedQuestions"
      :cert-code="certCode"
      :topic-breakdown="topicBreakdown"
      :theme-breakdown="themeBreakdown"
      :theme-groups="themeGroups"
      :passing-percent="passingPercent"
      :show-review-button="true"
      :has-flagged-questions="hasFlaggedQuestions"
    />

    <section class="history-section">
      <div class="history-header">
        <h2>{{ texts.quizHistory }}</h2>
        <SecondaryButton
          v-if="entries.length > 0"
          size="sm"
          danger
          @click="showResetModal = true"
        >
          {{ texts.resetAll }}
        </SecondaryButton>
      </div>
      <QuizHistoryList :cert-code="certCode" @request-delete="requestDelete" />
    </section>

    <footer class="dashboard__footer">
    </footer>

    <ConfirmModal
      v-if="deleteTargetId"
      :title="texts.deleteQuizTitle"
      :message="texts.deleteQuizMessage"
      :confirm-label="texts.delete"
      :cancel-label="texts.cancel"
      @confirm="confirmDelete"
      @cancel="deleteTargetId = null"
    />

    <ConfirmModal
      v-if="showResetModal"
      :title="texts.resetAllTitle"
      :message="texts.resetAllMessage"
      :confirm-label="texts.resetAll"
      :cancel-label="texts.cancel"
      @confirm="confirmReset"
      @cancel="showResetModal = false"
    />
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.dashboard__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.header-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.dashboard__header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--text-h);
  flex: 1;
  text-align: center;
}

.all-time {
  margin-bottom: 24px;
}

.all-time h2,
.history-section h2 {
  font-size: 18px;
  color: var(--text-h);
  margin: 0 0 12px;
}

.all-time-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-h);
}

.stat-label {
  font-size: 13px;
  color: var(--text);
}

.history-section {
  margin-bottom: 24px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard__footer {
  display: flex;
  justify-content: center;
}
</style>
