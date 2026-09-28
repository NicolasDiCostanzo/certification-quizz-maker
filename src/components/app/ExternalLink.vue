<script setup lang="ts">
withDefaults(defineProps<{ href: string; label: string; iconOnly?: boolean }>(), { iconOnly: false })
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
  color: var(--text);
  font-size: 15px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.external-link:hover {
  color: var(--text-h);
}

.external-link :deep(svg) {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.external-link--icon {
  color: var(--text);
}
</style>