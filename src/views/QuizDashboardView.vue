<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserProgressStore } from '../stores/userProgress'
import { texts } from '../texts/en'
import { breakdownByThemeAllTime, breakdownByTopicAllTime } from '../utils/scoreBreakdown'

import ConfirmModal from '../components/ConfirmModal.vue'
import QuizHistoryList from '../components/QuizHistoryList.vue'
import ReviewBreakdown from '../components/ReviewBreakdown.vue'

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

const passingPercent = computed(() => {
  const ps = cert.value?.exam.passingScore
  if (!ps) return 0
  return ps.scale ? Math.round((ps.passingScore / ps.scale) * 100) : ps.passingScore
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
        <button type="button" class="cta" @click="goHome">{{ texts.backToHomeCta }}</button>
        <button type="button" class="cta" @click="startQuiz">{{ texts.startQuizCta }}</button>
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
      v-if="entries.length > 0"
      :cert-code="certCode"
      :topic-breakdown="topicBreakdown"
      :theme-breakdown="themeBreakdown"
      :theme-groups="themeGroups"
      :passing-percent="passingPercent"
      :show-review-button="true"
    />

    <section class="history-section">
      <div class="history-header">
        <h2>{{ texts.quizHistory }}</h2>
        <button
          v-if="entries.length > 0"
          type="button"
          class="btn-reset"
          @click="showResetModal = true"
        >
          {{ texts.resetAll }}
        </button>
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

.cta {
  padding: 8px 12px;
  font-size: 14px;
  color: var(--cta-text);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  background: var(--cta);
  border: 1px solid var(--border);
}

.cta:hover {
  opacity: 0.9;
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

.btn-reset {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
}

.btn-reset:hover {
  border-color: var(--red);
  color: var(--red);
}

.dashboard__footer {
  display: flex;
  justify-content: center;
}
</style>
