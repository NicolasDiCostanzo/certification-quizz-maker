<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>

<template>
  <div class="cert-fact">
    <dt>{{ label }}</dt>
    <dd>{{ value }}</dd>
  </div>
</template>

<style scoped>
.cert-fact dt {
  font-size: 13px;
  color: var(--text);
}

.cert-fact dd {
  margin: 2px 0 0;
  font-weight: 500;
  color: var(--text-h);
}
</style>
