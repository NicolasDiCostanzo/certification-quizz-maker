<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  variant?: 'code' | 'flag' | 'status-correct' | 'status-incorrect' | 'tag' | 'weight'
  size?: 'sm' | 'md'
}>(), {
  as: 'span',
  variant: 'code',
  size: 'sm',
})
</script>

<template>
  <component :is="as" class="badge" :class="[`badge--${variant}`, `badge--${size}`]">
    <slot />
  </component>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  font-weight: 600;
}

.badge--sm { font-size: 12px; }
.badge--md { font-size: 13px; }

.badge--code {
  font-family: var(--mono);
  color: var(--text-h);
  background: var(--code-bg);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
}

.badge--flag {
  color: var(--accent);
  background: var(--accent-bg);
  border-radius: var(--radius-pill);
  padding: 2px 8px;
}

.badge--status-correct {
  color: var(--green);
  background: color-mix(in srgb, var(--green) 15%, var(--surface));
  border-radius: var(--radius-sm);
  padding: 4px 10px;
}

.badge--status-incorrect {
  color: var(--red);
  background: color-mix(in srgb, var(--red) 15%, var(--surface));
  border-radius: var(--radius-sm);
  padding: 4px 10px;
}

.badge--tag {
  color: var(--text-h);
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
}

.badge--weight {
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}

.badge--weight strong {
  color: var(--accent);
}
</style>
