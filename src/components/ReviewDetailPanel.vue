<script setup lang="ts">
import { texts } from '../texts/en';
import type { Question, QuestionAnswer } from '../types';
import { parseInlineSegments } from '../utils/markdownImage';
import Badge from './BaseBadge.vue';
import Card from './BaseCard.vue';
import QuestionOptionsList from './QuestionOptionsList.vue';
import SecondaryButton from './SecondaryButton.vue';

defineProps<{
  question: Question | null
  answer: QuestionAnswer | null
  themeGroups: string[]
  flagged: boolean
}>()

const emit = defineEmits<{
  'toggle-flag': [questionId: string]
}>()

function renderSegments(text: string) {
  return parseInlineSegments(text)
}

</script>

<template>
  <Card tag="section" padding="xl" radius="2xl" class="detail-panel">
    <div v-if="question" class="detail-panel__content">
      <div class="detail-panel__tags">
        <Badge variant="tag">{{ texts.topic }}: {{ question.topic }}</Badge>
        <template v-for="group in themeGroups" :key="group">
          <Badge v-if="question.themes?.[group]?.length" variant="tag">
            {{ texts.themeGroupDisplay(group, question.themes[group]) }}
          </Badge>
        </template>
      </div>
      <p class="detail-panel__question">
        <template v-for="(segment, i) in renderSegments(question.question)" :key="i">
          <img v-if="segment.type === 'image'" :src="segment.value" :alt="segment.alt" class="inline-image" />
          <template v-else>{{ segment.value }}</template>
        </template>
      </p>
      <QuestionOptionsList
        class="detail-options"
        :question="question"
        :selected="answer?.selected ?? []"
        variant="review"
      />
      <div class="detail-panel__status">
        <Badge
          class="status-badge"
          size="md"
          :variant="answer?.correct ? 'status-correct' : 'status-incorrect'"
        >
          {{ answer?.correct ? texts.correct : texts.incorrect }}
        </Badge>
        <p v-if="answer">{{ texts.yourAnswer }}: {{ answer.selected.join(', ') }}</p>
        <p v-else>{{ texts.noAnswer }}</p>
        <p v-if="answer && !answer.correct">
          {{ texts.correctAnswer }}: {{ Array.isArray(question.answers) ? question.answers.join(', ') : question.answers }}
        </p>
      </div>
      <div v-if="question.explanation" class="detail-panel__explanation">
        <strong>{{ texts.explanation }}:</strong> {{ question.explanation }}
      </div>
      <SecondaryButton size="md" @click="emit('toggle-flag', question.id)">
        {{ flagged ? texts.unflag : texts.flag }}
      </SecondaryButton>
    </div>
  </Card>
</template>

<style scoped>
.detail-panel {
  margin-bottom: 24px;
}

.detail-panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-panel__question {
  font-size: 17px;
  line-height: 1.5;
  color: var(--text-h);
  margin: 0 0 16px;
}

.detail-options {
  margin-bottom: 16px;
}

.detail-panel__status {
  margin-bottom: 16px;
}

.detail-panel__status p {
  margin: 4px 0;
  color: var(--text);
}

.status-badge {
  margin-bottom: 8px;
}

.detail-panel__explanation {
  padding: 12px 14px;
  background: var(--accent-bg);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}
</style>
