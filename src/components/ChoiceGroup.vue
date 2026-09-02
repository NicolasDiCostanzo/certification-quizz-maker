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
