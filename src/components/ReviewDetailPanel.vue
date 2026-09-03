<script setup lang="ts">
import { useUserProgressStore } from '../stores/userProgress';
import { texts } from '../texts/en';
import type { Question, QuestionAnswer } from '../types';
import { parseInlineSegments } from '../utils/markdownImage';
import { groupLabel } from '../utils/themeGroupLabel';

const props = defineProps<{
  question: Question | null
  answer: QuestionAnswer | null
  certCode: string
  themeGroups: string[]
}>()

const progressStore = useUserProgressStore()

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

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
  <section class="detail-panel">
    <div v-if="question" class="detail-panel__content">
      <div class="detail-panel__tags">
        <span class="tag">{{ texts.topic }}: {{ question.topic }}</span>
        <template v-for="group in themeGroups" :key="group">
          <span v-if="question.themes?.[group]?.length" class="tag">
            {{ texts.themeGroupDisplay(groupLabel(group), question.themes[group]) }}
          </span>
        </template>
      </div>
      <p class="detail-panel__question">
        <template v-for="(segment, i) in renderSegments(question.question)" :key="i">
          <img v-if="segment.type === 'image'" :src="segment.value" :alt="segment.alt" class="inline-image" />
          <template v-else>{{ segment.value }}</template>
        </template>
      </p>
      <ul class="options">
        <label v-for="(option, i) in question.options" :key="option" class="option" :class="letterClass(letters[i])">
          <span class="option-letter">{{ letters[i] }}</span>
          <span class="option-text">
            <template v-for="(segment, j) in renderSegments(option)" :key="j">
              <img v-if="segment.type === 'image'" :src="segment.value" :alt="segment.alt" class="inline-image" />
              <template v-else>{{ segment.value }}</template>
            </template>
          </span>
        </label>
      </ul>
      <div class="detail-panel__status">
        <span class="status-badge" :class="answer?.correct ? 'status-badge--correct' : 'status-badge--incorrect'">
          {{ answer?.correct ? texts.correct : texts.incorrect }}
        </span>
        <p v-if="answer">{{ texts.yourAnswer }}: {{ answer.selected.join(', ') }}</p>
        <p v-else>{{ texts.noAnswer }}</p>
        <p v-if="answer && !answer.correct">
          {{ texts.correctAnswer }}: {{ Array.isArray(question.answers) ? question.answers.join(', ') : question.answers }}
        </p>
      </div>
      <div v-if="question.explanation" class="detail-panel__explanation">
        <strong>{{ texts.explanation }}:</strong> {{ question.explanation }}
      </div>
      <button type="button" class="flag-toggle" @click="progressStore.toggleFlag(certCode, question.id)">
        {{ progressStore.isFlagged(certCode, question.id) ? texts.unflag : texts.flag }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.detail-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.detail-panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 10px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-h);
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
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}

.status-badge--correct {
  background: color-mix(in srgb, var(--green) 15%, var(--surface));
  color: var(--green);
}

.status-badge--incorrect {
  background: color-mix(in srgb, var(--red) 15%, var(--surface));
  color: var(--red);
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

.flag-toggle {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-h);
  cursor: pointer;
  font-size: 14px;
}

.flag-toggle:hover {
  border-color: var(--accent);
}
</style>
