<script setup lang="ts">
import Badge from '../ui/BaseBadge.vue';

defineProps<{ topic: string; weight: number }>()
</script>

<template>
  <Badge as="li" variant="weight" class="weight-pill">
    <strong>{{ weight }}%</strong> {{ topic }}
  </Badge>
</template>

<style scoped>
.weight-pill {
  overflow: hidden;
  min-width: 0;
}

.weight-pill strong {
  color: var(--accent);
}
</style>
