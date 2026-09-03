<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import QuestionCard from '../components/QuestionCard.vue'
import TimerBar from '../components/TimerBar.vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import { useUserProgressStore } from '../stores/userProgress'
import { texts } from '../texts/en'
import { computeScore } from '../utils/scoring'

const router = useRouter()
const store = useQuizSessionStore()
const progressStore = useUserProgressStore()
const { getCert } = useQuizLoader()

const session = computed(() => store.currentSession)
const question = computed(() => store.currentQuestion)
const certCode = computed(() => session.value?.certCode ?? '')
const total = computed(() => session.value?.questions.length ?? 0)
const index = computed(() => (session.value?.currentIndex ?? 0) + 1)
const selected = computed(() => question.value ? (session.value?.answers[question.value.id]?.selected ?? []) : [])
const isFlagged = computed(() => question.value ? (session.value?.flags.includes(question.value.id) ?? false) : false)
const isLast = computed(() => session.value ? session.value.currentIndex >= session.value.questions.length - 1 : false)
const isFirst = computed(() => (session.value?.currentIndex ?? 0) === 0)
const isExam = computed(() => session.value?.mode === 'exam')
const submitted = ref(false)
const reveal = computed(() => !isExam.value && submitted.value)
const canSubmit = computed(() => !isExam.value && !submitted.value && selected.value.length > 0)

watch(question, () => {
  submitted.value = false
})

function submitAnswer() {
  if (!canSubmit.value) return
  submitted.value = true
}

function handleSelect(questionId: string, letters: string[]) {
  store.answerQuestion(questionId, letters)
}

function toggleFlag() {
  if (!question.value) return
  store.toggleFlag(question.value.id)
  progressStore.toggleFlag(certCode.value, question.value.id)
}

function goNext() {
  if (isLast.value) {
    finishQuiz()
  } else {
    store.nextQuestion()
  }
}

function goPrev() {
  store.previousQuestion()
}

function finishQuiz() {
  if (!session.value || session.value.finished) return
  for (const [questionId, answer] of Object.entries(session.value.answers)) {
    progressStore.recordAnswer(session.value.certCode, questionId, answer.correct)
  }
  const cert = getCert(certCode.value)
  if (!cert) return
  const result = computeScore(session.value.questions, session.value.answers, cert.exam)
  store.finishSession(result)
  router.push({ name: 'quiz-review', params: { certCode: certCode.value } })
}

function handleTimeUp() {
  finishQuiz()
}

watch(session, (newSession) => {
  if (!newSession) return
  const flaggedIds = new Set(newSession.flags)
  for (const questionId of newSession.questions.map((q) => q.id)) {
    const isCurrentlyFlagged = progressStore.isFlagged(newSession.certCode, questionId)
    if (flaggedIds.has(questionId) && !isCurrentlyFlagged) {
      progressStore.toggleFlag(newSession.certCode, questionId)
    } else if (!flaggedIds.has(questionId) && isCurrentlyFlagged) {
      progressStore.toggleFlag(newSession.certCode, questionId)
    }
  }
}, { immediate: true })
</script>

<template>
  <div v-if="session && question" class="session">
    <div class="session-header">
      <div class="progress">
        <span class="progress-text">{{ texts.questionOf(index, total) }}</span>
        <span v-if="isFlagged" class="flag-badge">{{ texts.flagged }}</span>
      </div>
      <TimerBar v-if="isExam && session.deadlineAt" :deadline-at="session.deadlineAt" @time-up="handleTimeUp" />
    </div>

    <QuestionCard
      :question="question"
      :selected="selected"
      :reveal="reveal"
      :disabled="reveal"
      @select="handleSelect"
    />

    <div class="session-nav">
      <button type="button" class="nav-btn" :disabled="isFirst" @click="goPrev()">
        {{ texts.previous }}
      </button>
      <button
        v-if="!isExam"
        type="button"
        class="nav-btn submit-btn"
        :disabled="!canSubmit"
        @click="submitAnswer()"
      >
        {{ texts.submit }}
      </button>
      <button type="button" class="nav-btn flag-btn" :class="{ 'flag-btn--active': isFlagged }" @click="toggleFlag()">
        {{ isFlagged ? texts.unflag : texts.flag }}
      </button>
      <button
        type="button"
        class="nav-btn nav-btn--primary"
        @click="goNext()"
      >
        {{ isLast ? texts.finish : texts.next }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.session {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 1rem;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 2rem;
  flex-wrap: wrap;
}

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-weight: 600;
  color: var(--text-h);
}

.flag-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent);
}

.session-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--accent);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
  margin-left: auto;
}

.nav-btn--primary:hover {
  border-color: var(--accent);
  opacity: 0.9;
}

.flag-btn--active {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 1024px) {
  .session-nav {
    flex-direction: column;
  }
  .nav-btn--primary {
    margin-left: 0;
  }
}
</style>
