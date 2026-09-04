<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  pill?: boolean
  ghost?: boolean
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
    class="btn btn--primary"
    :class="[`btn--${size}`, { 'btn--pill': pill, 'btn--ghost': ghost, 'btn--danger': danger, 'btn--block': block }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: var(--bg);
  transition: opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--sm {
  padding: 8px 12px;
  font-size: 14px;
}

.btn--md {
  padding: 10px 18px;
  font-size: 14px;
}

.btn--lg {
  padding: 12px 24px;
  font-size: 16px;
}

.btn--pill {
  border-radius: var(--radius-pill);
}

.btn--block {
  width: 100%;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--ghost {
  background: var(--accent-bg);
  color: var(--accent);
  border-color: var(--accent-border);
}

.btn--ghost:hover:not(:disabled) {
  border-color: var(--accent);
  opacity: 1;
}

.btn--danger {
  background: transparent;
  color: var(--red);
  border-color: var(--red);
}

.btn--danger:hover:not(:disabled) {
  border-color: var(--accent);
  opacity: 1;
}
</style>
