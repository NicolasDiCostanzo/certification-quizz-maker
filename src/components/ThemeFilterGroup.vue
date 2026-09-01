<script setup lang="ts">
import type { ThemeGroupFilter } from '../types'
import ThemeFilter from './ThemeFilter.vue'

defineProps<{
  label: string
  values: string[]
  modelValue: ThemeGroupFilter
  matchChoice: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: ThemeGroupFilter] }>()
</script>

<template>
  <ThemeFilter
    :label="label"
    :values="values"
    :model-value="modelValue"
    :match-choice="matchChoice"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>


