<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { QuizHistoryEntry } from '../types'
import { texts } from '../texts/en'
import { useQuizHistoryStore } from '../stores/quizHistory'

const props = defineProps<{
  certCode: string
}>()

const router = useRouter()
const historyStore = useQuizHistoryStore()

const entries = computed(() => historyStore.byCertCode(props.certCode))

const emit = defineEmits<{
  requestDelete: [id: string]
}>()

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function reviewEntry(entry: QuizHistoryEntry) {
  router.push({ name: 'quiz-history-review', params: { certCode: props.certCode, entryId: entry.id } })
}
</script>

<template>
  <div class="history-list">
    <div v-if="entries.length === 0" class="empty">
      <p>{{ texts.noQuizzesTaken }}</p>
    </div>
    <div v-else class="entries">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="entry"
      >
        <div class="entry-info">
          <span class="entry-mode">{{ entry.mode === 'exam' ? texts.modeExam : texts.modePreparation }}</span>
          <span class="entry-date">{{ formatDate(entry.finishedAt) }}</span>
          <span class="entry-score" :class="entry.result.passed ? 'score--passed' : 'score--failed'">
            {{ Math.round(entry.result.percentCorrect) }}%
          </span>
        </div>
        <div class="entry-actions">
          <button type="button" class="btn-review" @click="reviewEntry(entry)">{{ texts.review }}</button>
          <button type="button" class="btn-delete" @click="emit('requestDelete', entry.id)">{{ texts.delete }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-list {
  margin-top: 16px;
}

.empty {
  color: var(--text);
  font-size: 14px;
  text-align: center;
  padding: 24px;
}

.entries {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.entry-mode {
  font-weight: 500;
  color: var(--text-h);
  font-size: 14px;
}

.entry-date {
  color: var(--text);
  font-size: 13px;
}

.entry-score {
  font-weight: 600;
  font-size: 14px;
}

.score--passed {
  color: var(--green);
}

.score--failed {
  color: var(--red);
}

.entry-actions {
  display: flex;
  gap: 8px;
}

.btn-review,
.btn-delete {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
}

.btn-review:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-delete:hover {
  border-color: var(--red);
  color: var(--red);
}
</style>
