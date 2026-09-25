<script setup lang="ts">
import Badge from '../ui/BaseBadge.vue'

defineProps<{ code: string }>()
</script>

<template>
  <Badge variant="code" class="cert-code">{{ code }}</Badge>
</template>

<style scoped>
.cert-code {
  align-self: flex-start;
}
</style>
