<script setup lang="ts">
defineProps<{ topic: string; weight: number }>()
</script>

<template>
  <li class="cert-weight-pill">
    {{ topic }} <strong>{{ weight }}%</strong>
  </li>
</template>

<style scoped>
.cert-weight-pill {
  font-size: 13px;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 10px;
}

.cert-weight-pill strong {
  color: var(--accent);
}
</style>
