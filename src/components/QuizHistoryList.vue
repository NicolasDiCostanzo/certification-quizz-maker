<script setup lang="ts">
import QuizHistoryItem from './QuizHistoryItem.vue'
import { texts } from '../texts/en'
import type { QuizHistoryEntry } from '../types'

defineProps<{
  entries: QuizHistoryEntry[]
}>()

const emit = defineEmits<{
  requestDelete: [id: string]
  review: [id: string]
}>()
</script>

<template>
  <div class="history-list">
    <div v-if="entries.length === 0" class="empty">
      <p>{{ texts.noQuizzesTaken }}</p>
    </div>
    <div v-else class="entries">
      <QuizHistoryItem
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @review="emit('review', entry.id)"
        @request-delete="emit('requestDelete', $event)"
      />
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
</style>
