<script setup lang="ts">
import { useUserProgressStore } from '../stores/userProgress';
import type { Question, QuestionAnswer } from '../types';
import QuestionSummaryCard from './QuestionSummaryCard.vue';

defineProps<{
  questions: Question[]
  answers: Record<string, QuestionAnswer>
  certCode: string
  selectedQuestionId: string | null
  title?: string
}>()

const emit = defineEmits<{
  select: [questionId: string]
}>()

const progressStore = useUserProgressStore()
</script>

<template>
  <section class="questions-section">
    <div class="questions-grid">
      <QuestionSummaryCard
        v-for="(question, i) in questions"
        :key="question.id"
        :question-id="question.id"
        :index="i + 1"
        :correct="answers[question.id]?.correct ?? false"
        :flagged="progressStore.isFlagged(certCode, question.id)"
        :selected="selectedQuestionId === question.id"
        @select="emit('select', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.questions-section {
  margin-bottom: 24px;
}

.questions-section h2 {
  font-size: 18px;
  color: var(--text-h);
  margin: 0 0 12px;
}

.questions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 75vh;
  overflow-y: auto;
  padding: 4px;
}
</style>
