<script setup lang="ts">
withDefaults(defineProps<{ href: string; label?: string; iconOnly?: boolean }>(), { iconOnly: false })
</script>

<template>
  <a
    class="external-link"
    :class="{ 'external-link--icon': iconOnly }"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="iconOnly ? label : undefined"
    :title="iconOnly ? label : undefined"
  >
    <slot name="icon" />
    <span v-if="!iconOnly" class="external-link__label">{{ label }}</span>
  </a>
</template>

<style scoped>
.external-link {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  color: var(--text-h);
  font-size: 15px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.external-link:hover {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.external-link :deep(svg) {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.external-link--icon {
  flex-direction: row;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text);
  flex-shrink: 0;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.external-link--icon :deep(svg) {
  width: 17px;
  height: 17px;
}

.external-link--icon:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-bg);
}
</style>