<script setup lang="ts" generic="T extends string">
import FilterOption from './FilterOption.vue'

defineProps<{
  name: string
  label: string
  options: { value: T; label: string }[]
  modelValue: T
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <fieldset class="panel">
    <legend>{{ label }}</legend>
    <FilterOption v-for="option in options" :key="option.value" :text="option.label">
      <input
        type="radio"
        :name="name"
        :checked="modelValue === option.value"
        @change="emit('update:modelValue', option.value)"
      />
    </FilterOption>
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
</style>
