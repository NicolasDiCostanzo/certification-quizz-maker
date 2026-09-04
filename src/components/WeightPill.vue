<script setup lang="ts">
import Badge from './BaseBadge.vue'

defineProps<{ topic: string; weight: number }>()
</script>

<template>
  <Badge as="li" variant="weight" class="weight-pill">
    {{ topic }} <strong>{{ weight }}%</strong>
  </Badge>
</template>

<style scoped>
.weight-pill strong {
  color: var(--accent);
}
</style>
