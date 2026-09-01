<script setup lang="ts">
import type { ThemeGroupFilter } from '../types'
import { texts } from '../texts/en'
import FilterOption from './FilterOption.vue'

const props = defineProps<{
  label: string
  values: string[]
  modelValue: ThemeGroupFilter
  matchChoice: boolean
  disabledValues?: string[]
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
    <div v-if="matchChoice" class="match-choice" role="radiogroup" :aria-label="texts.matchChoiceLabel">
      <FilterOption :text="texts.matchAny">
        <input
          type="radio"
          :name="`match-${label}`"
          :checked="modelValue.match === 'any'"
          @change="setMatch('any')"
        />
      </FilterOption>
      <FilterOption :text="texts.matchAll">
        <input
          type="radio"
          :name="`match-${label}`"
          :checked="modelValue.match === 'all'"
          @change="setMatch('all')"
        />
      </FilterOption>
    </div>
    <FilterOption v-for="value in values" :key="value" :text="value">
      <input
        type="checkbox"
        :checked="modelValue.values.includes(value)"
        :disabled="disabledValues?.includes(value) ?? false"
        @change="toggle(value, ($event.target as HTMLInputElement).checked)"
      />
    </FilterOption>
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

.match-choice {
  display: flex;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
</style>
