<script setup lang="ts">
import { useUserProgressStore } from '../stores/userProgress';
import { texts } from '../texts/en';
import type { Question, QuestionAnswer } from '../types';
import { parseInlineSegments } from '../utils/markdownImage';
import Badge from './BaseBadge.vue';
import Card from './BaseCard.vue';
import SecondaryButton from './SecondaryButton.vue';

const props = defineProps<{
  question: Question | null
  answer: QuestionAnswer | null
  certCode: string
  themeGroups: string[]
}>()

const progressStore = useUserProgressStore()

function letterForIndex(index: number): string {
  return String.fromCharCode(65 + index)
}

function isCorrectLetter(letter: string): boolean {
  if (!props.question) return false
  const expected = Array.isArray(props.question.answers)
    ? props.question.answers
    : [props.question.answers]
  return expected.includes(letter)
}

function letterClass(letter: string): string {
  if (isCorrectLetter(letter)) return 'option--correct'
  if (props.answer?.selected.includes(letter)) return 'option--incorrect'
  return 'option--missed'
}

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
      <ul class="options">
        <label v-for="(option, i) in question.options" :key="option" class="option" :class="letterClass(letterForIndex(i))">
          <span class="option-letter">{{ letterForIndex(i) }}</span>
          <span class="option-text">
            <template v-for="(segment, j) in renderSegments(option)" :key="j">
              <img v-if="segment.type === 'image'" :src="segment.value" :alt="segment.alt" class="inline-image" />
              <template v-else>{{ segment.value }}</template>
            </template>
          </span>
        </label>
      </ul>
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
      <SecondaryButton size="md" @click="progressStore.toggleFlag(certCode, question.id)">
        {{ progressStore.isFlagged(certCode, question.id) ? texts.unflag : texts.flag }}
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

.inline-image {
  max-width: 100%;
  border-radius: 6px;
  vertical-align: middle;
}

.options {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.option--correct {
  border-color: var(--green);
  background: color-mix(in srgb, var(--green) 10%, var(--surface));
}

.option--incorrect {
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, var(--surface));
}

.option--missed {
  opacity: 0.6;
}

.option-letter {
  font-weight: 600;
  color: var(--text-h);
  flex-shrink: 0;
}

.option-text {
  color: var(--text);
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
