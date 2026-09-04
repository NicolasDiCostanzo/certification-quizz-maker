<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import QuizHistoryItem from './QuizHistoryItem.vue'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { texts } from '../texts/en'
import type { QuizHistoryEntry } from '../types'

const props = defineProps<{
  certCode: string
}>()

const router = useRouter()
const historyStore = useQuizHistoryStore()

const entries = computed(() => historyStore.byCertCode(props.certCode))

const emit = defineEmits<{
  requestDelete: [id: string]
}>()

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
      <QuizHistoryItem
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @review="reviewEntry(entry)"
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
