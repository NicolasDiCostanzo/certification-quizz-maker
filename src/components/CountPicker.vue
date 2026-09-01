<script setup lang="ts">
import { computed, watch } from 'vue'
import { texts } from '../texts/en'

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
    }
  },
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
  <fieldset class="panel">
    <legend>{{ texts.countLabel }}</legend>
    <label class="filter-option">
      <input
        type="radio"
        name="count-mode"
        :checked="modelValue === 'all'"
        @change="emit('update:modelValue', 'all')"
      />
      <span>{{ texts.countAll(max) }}</span>
    </label>
    <label class="filter-option">
      <input
        type="radio"
        name="count-mode"
        :checked="isCustom"
        :disabled="max < 1"
        @change="emit('update:modelValue', max < 1 ? 'all' : Math.min(max, 1))"
      />
      <span>{{ texts.countCustomLabel }}</span>
    </label>
    <input
      v-if="isCustom"
      class="count-input"
      type="number"
      min="1"
      :max="max"
      :value="modelValue"
      @change="updateCount"
    />
  </fieldset>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.panel legend {
  font-weight: 600;
  color: var(--text-h);
  padding: 0 4px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

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
