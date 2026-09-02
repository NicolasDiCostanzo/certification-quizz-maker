<script setup lang="ts">
import { computed } from 'vue';
import type { Question } from '../types';
import { parseInlineSegments } from '../utils/markdownImage';

const props = defineProps<{
  question: Question
  selected: string[]
  reveal: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [questionId: string, selected: string[]]
}>()

const isMultiAnswer = computed(() => Array.isArray(props.question.answers) && props.question.answers.length > 1)

function toggle(letter: string) {
  if (props.disabled) return
  const current = props.selected
  if (isMultiAnswer.value) {
    const next = current.includes(letter) ? current.filter((l) => l !== letter) : [...current, letter]
    emit('select', props.question.id, next)
  } else {
    emit('select', props.question.id, [letter])
  }
}

function isCorrectLetter(letter: string): boolean {
  const expected = Array.isArray(props.question.answers) ? props.question.answers : [props.question.answers]
  return expected.includes(letter)
}

function letterClass(letter: string) {
  if (!props.reveal) return ''
  if (isCorrectLetter(letter)) return 'option--correct'
  if (props.selected.includes(letter)) return 'option--incorrect'
  return 'option--missed'
}

function renderSegments(text: string) {
  return parseInlineSegments(text)
}

const isCorrect = computed(() => props.selected.length > 0 && props.selected.every((l) => isCorrectLetter(l)) && props.selected.length === (Array.isArray(props.question.answers) ? props.question.answers.length : 1))

const displayAnswer = computed(() => {
  const expected = Array.isArray(props.question.answers) ? props.question.answers : [props.question.answers]
  return expected.join(', ')
})
</script>

<template>
  <div class="question">
    <p class="question-text">
      <template v-for="(segment, i) in renderSegments(question.question)" :key="i">
        <img v-if="segment.type === 'image'" :src="segment.value" :alt="segment.alt" class="inline-image" />
        <template v-else>{{ segment.value }}</template>
      </template>
    </p>

    <ul v-if="question.promptImages?.length" class="prompt-images">
      <li v-for="(img, i) in question.promptImages" :key="i">
        <img :src="img" alt="Prompt image" />
      </li>
    </ul>

    <div class="options">
      <label
        v-for="(option, i) in question.options"
        :key="option"
        class="option"
        :class="[letterClass(letters[i]), { 'option--selected': selected.includes(letters[i]) }]"
      >
        <input
          :type="isMultiAnswer ? 'checkbox' : 'radio'"
          :name="question.id"
          :value="letters[i]"
          :checked="selected.includes(letters[i])"
          :disabled="disabled"
          @change="toggle(letters[i])"
        />
        <span class="option-letter">{{ letters[i] }}</span>
        <span class="option-text">
          <template v-for="(segment, j) in renderSegments(option)" :key="j">
            <img v-if="segment.type === 'image'" :src="segment.value" :alt="segment.alt" class="inline-image" />
            <template v-else>{{ segment.value }}</template>
          </template>
        </span>
      </label>
    </div>

    <div v-if="reveal" class="feedback" :class="isCorrect ? 'feedback--correct' : 'feedback--incorrect'">
      <span class="feedback-badge">{{ isCorrect ? 'Correct' : 'Incorrect' }}</span>
      <p v-if="!isCorrect || question.explanation" class="feedback-explanation">
        <template v-if="!isCorrect">
          <strong>Correct answer:</strong> {{ displayAnswer }}<br />
        </template>
        <template v-if="question.explanation">
          <strong>Explanation:</strong> {{ question.explanation }}
        </template>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
</script>

<style scoped>
.question-text {
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

.prompt-images {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-images img {
  max-width: 100%;
  border-radius: 6px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.option:hover {
  border-color: var(--accent);
}

.option--selected {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.option--correct {
  border-color: var(--green);
  background: var(--accent-bg);
}

.option--incorrect {
  border-color: var(--red);
  background: color-mix(in srgb, var(--text) 6%, transparent);
}

.option--missed {
  opacity: 0.6;
}

.option input {
  margin-top: 2px;
  accent-color: var(--accent);
}

.option-letter {
  font-weight: 600;
  color: var(--text-h);
  flex-shrink: 0;
}

.option-text {
  color: var(--text);
  text-align: left;
}

.feedback {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid;
}

.feedback--correct {
  border-color: var(--green);
  background: var(--accent-bg);
}

.feedback--incorrect {
  border-color: var(--red);
  background: color-mix(in srgb, var(--text) 6%, transparent);
}

.feedback-badge {
  font-weight: 600;
  font-size: 14px;
}

.feedback--correct .feedback-badge {
  color: var(--accent);
}

.feedback--incorrect .feedback-badge {
  color: var(--text);
}

.feedback-explanation {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
}
</style>
