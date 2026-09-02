<script setup lang="ts">
import { useId } from 'vue';
import { texts } from '../texts/en';
import type { ThemeGroupFilter } from '../types';
import FilterOption from './FilterOption.vue';

const uid = useId()

const props = defineProps<{
  label?: string
  values: string[]
  modelValue: ThemeGroupFilter
  matchChoice: boolean
  disabledValues?: string[]
  labelClass?: string
  allOption?: boolean
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

function selectAll() {
  emit('update:modelValue', { ...props.modelValue, values: [] })
}
</script>

<template>
  <div class="filter-group" role="group" :aria-label="label">
    <h3 v-if="label" :class="labelClass ?? 'group-label'">{{ label }}</h3>
    <div class="match-choice" v-if="matchChoice" role="radiogroup" :aria-label="texts.matchTagsLabel">
      <FilterOption :text="texts.matchAny">
        <input
          type="radio"
          :name="`match-${uid}`"
          :checked="modelValue.match === 'any'"
          @change="setMatch('any')"
        />
      </FilterOption>
      <FilterOption :text="texts.matchAll">
        <input
          type="radio"
          :name="`match-${uid}`"
          :checked="modelValue.match === 'all'"
          @change="setMatch('all')"
        />
      </FilterOption>
    </div>
    <div class="values-list">
      <FilterOption v-if="allOption" class="all-option" :text="texts.topicsAllOption">
        <input
          type="checkbox"
          :checked="modelValue.values.length === 0"
          @change="selectAll()"
        />
      </FilterOption>
      <FilterOption v-for="value in values" :key="value" :text="value">
        <input
          type="checkbox"
          :checked="modelValue.values.includes(value)"
          :disabled="disabledValues?.includes(value) ?? false"
          @change="toggle(value, ($event.target as HTMLInputElement).checked)"
        />
      </FilterOption>
    </div>
  </div>
</template>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 10px;
  padding: 0.5rem;
  border: 1px solid var(--border);
}

.group-label {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
}

.match-choice {
  display: flex;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.values-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
  padding-inline-start: 20px;
  box-shadow: inset 0 0 6px -2px var(--shadow);
}

.all-option {
  font-weight: 600;
  color: var(--text-h);
}
</style>
