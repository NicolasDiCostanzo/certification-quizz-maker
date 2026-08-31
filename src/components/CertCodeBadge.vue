<script setup lang="ts">
defineProps<{ code: string }>()
</script>

<template>
  <p class="cert-code">{{ code }}</p>
</template>

<style scoped>
.cert-code {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-h);
  background: var(--code-bg);
  border-radius: 4px;
  padding: 2px 8px;
  align-self: flex-start;
}
</style>
