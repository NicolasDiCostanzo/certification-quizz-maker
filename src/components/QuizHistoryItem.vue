<script setup lang="ts">
import { computed } from 'vue'
import Card from './BaseCard.vue'
import SecondaryButton from './SecondaryButton.vue'
import { texts } from '../texts/en'
import type { QuizHistoryEntry } from '../types'

const props = defineProps<{
  entry: QuizHistoryEntry
}>()

const emit = defineEmits<{
  review: []
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

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min`
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return `${hours} h ${String(minutes).padStart(2, '0')} min`
}

const completedIn = computed(() => {
  const { startedAt, finishedAt } = props.entry
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt) || finishedAt < startedAt) {
    return null
  }
  return formatDuration(finishedAt - startedAt)
})
</script>

<template>
  <Card padding="sm" radius="lg" class="entry">
    <div class="entry-info">
      <span class="entry-mode">{{ entry.mode === 'exam' ? texts.modeExam : texts.modePreparation }}</span>
      <span class="entry-date">{{ formatDate(entry.finishedAt) }}</span>
      <span v-if="completedIn" class="entry-duration">{{ texts.completedIn(completedIn) }}</span>
      <span class="entry-score" :class="entry.result.passed ? 'score--passed' : 'score--failed'">
        {{ Math.round(entry.result.percentCorrect) }}%
      </span>
    </div>
    <div class="entry-actions">
      <SecondaryButton size="sm" @click="emit('review')">{{ texts.review }}</SecondaryButton>
      <SecondaryButton size="sm" danger @click="emit('requestDelete', entry.id)">{{ texts.delete }}</SecondaryButton>
    </div>
  </Card>
</template>

<style scoped>
.entry {
  display: flex;
  align-items: center;
  gap: 16px;
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.entry-mode {
  font-weight: 500;
  color: var(--text-h);
  font-size: 14px;
}

.entry-date,
.entry-duration {
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
  margin-left: auto;
}
</style>
