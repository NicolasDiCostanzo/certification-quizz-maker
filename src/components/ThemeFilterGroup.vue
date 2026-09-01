<script setup lang="ts">
import type { ThemeGroupFilter } from '../types'
import { texts } from '../texts/en'

const props = defineProps<{
  label: string
  values: string[]
  modelValue: ThemeGroupFilter
  matchChoice: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: ThemeGroupFilter] }>()

function toggle(value: string, checked: boolean) {
  const values = checked
    ? [...props.modelValue.values, value]
    : props.modelValue.values.filter((entry) => entry !== value)
  emit('update:modelValue', { ...props.modelValue, values })
}

function setMatch(match: ThemeGroupFilter['match']) {
  emit('update:modelValue', { ...props.modelValue, match })
}
</script>

<template>
  <div class="filter-group" role="group" :aria-label="label">
    <h3 class="group-label">{{ label }}</h3>
    <label v-for="value in values" :key="value" class="filter-option">
      <input
        type="checkbox"
        :checked="modelValue.values.includes(value)"
        @change="toggle(value, ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ value }}</span>
    </label>
    <div v-if="matchChoice" class="match-choice" role="radiogroup" :aria-label="texts.matchChoiceLabel">
      <label class="filter-option">
        <input
          type="radio"
          :name="`match-${label}`"
          :checked="modelValue.match === 'any'"
          @change="setMatch('any')"
        />
        <span>{{ texts.matchAny }}</span>
      </label>
      <label class="filter-option">
        <input
          type="radio"
          :name="`match-${label}`"
          :checked="modelValue.match === 'all'"
          @change="setMatch('all')"
        />
        <span>{{ texts.matchAll }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.group-label {
  margin: 0;
  font-size: 16px;
  color: var(--text-h);
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

.match-choice {
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
</style>
