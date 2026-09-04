<script setup lang="ts" generic="T extends string">
import Card from './BaseCard.vue'
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
  <Card tag="fieldset" padding="md" radius="xl" bg="none">
    <legend>{{ label }}</legend>
    <FilterOption v-for="option in options" :key="option.value" :text="option.label">
      <input
        type="radio"
        :name="name"
        :checked="modelValue === option.value"
        @change="emit('update:modelValue', option.value)"
      />
    </FilterOption>
  </Card>
</template>
