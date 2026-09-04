<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  danger?: boolean
  block?: boolean
}>(), {
  type: 'button',
  size: 'md',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="btn btn--secondary"
    :class="[`btn--${size}`, { 'btn--danger': danger, 'btn--block': block }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  font: inherit;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text);
  transition: border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn--md {
  padding: 8px 16px;
  font-size: 14px;
}

.btn--lg {
  padding: 10px 18px;
  font-size: 14px;
}

.btn--block {
  width: 100%;
}

.btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn--danger:hover:not(:disabled) {
  border-color: var(--red);
  color: var(--red);
}
</style>
