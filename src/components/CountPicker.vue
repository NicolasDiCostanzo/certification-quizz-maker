<script setup lang="ts">
import { computed, watch } from 'vue'
import { texts } from '../texts/en'
import Card from './BaseCard.vue'
import FilterOption from './FilterOption.vue'

type CountSelection = number | 'all'

const props = defineProps<{
  max: number
  modelValue: CountSelection
}>()

const emit = defineEmits<{ 'update:modelValue': [value: CountSelection] }>()

const isCustom = computed(() => props.modelValue !== 'all' && props.max >= 1)

watch(
  () => props.max,
  (max) => {
    if (max < 1 && props.modelValue !== 'all') {
      emit('update:modelValue', 'all')
      return
    }
    if (props.modelValue !== 'all' && props.modelValue > max) {
      emit('update:modelValue', max)
    }
  },
  { immediate: true },
)

function updateCount(event: Event) {
  if (props.max < 1) {
    emit('update:modelValue', 'all')
    return
  }
  const raw = Number((event.target as HTMLInputElement).value)
  const clamped = Math.max(1, Math.min(Math.floor(raw) || 1, props.max))
  emit('update:modelValue', clamped)
}
</script>

<template>
  <Card tag="fieldset" padding="md" radius="xl" bg="none">
    <legend>{{ texts.countLabel }}</legend>
    <FilterOption :text="texts.countAll(max)">
      <input
        type="radio"
        name="count-mode"
        :checked="modelValue === 'all'"
        @change="emit('update:modelValue', 'all')"
      />
    </FilterOption>
    <FilterOption :text="texts.countCustomLabel">
      <input
        type="radio"
        name="count-mode"
        :checked="isCustom"
        :disabled="max < 1"
        @change="emit('update:modelValue', max < 1 ? 'all' : Math.min(max, 1))"
      />
    </FilterOption>
    <input
      v-if="isCustom"
      class="count-input"
      type="number"
      min="1"
      :max="max"
      :value="modelValue"
      @change="updateCount"
    />
  </Card>
</template>

<style scoped>
.count-input {
  width: 90px;
  padding: 4px 8px;
  font: inherit;
  color: var(--text-h);
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
}
</style>
