<script setup lang="ts" generic="T extends string">

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
    <label v-for="option in options" :key="option.value" class="filter-option">
      <input
        type="radio"
        :name="name"
        :checked="modelValue === option.value"
        @change="emit('update:modelValue', option.value)"
      />
      <span>{{ option.label }}</span>
    </label>
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
</style>
