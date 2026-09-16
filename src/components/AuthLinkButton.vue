<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button type="button" class="auth-link" :disabled="disabled" @click="$emit('click')">
    <slot />
  </button>
</template>

<style scoped>
.auth-link {
  font: inherit;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  text-decoration: underline;
  align-self: center;
}

.auth-link:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
