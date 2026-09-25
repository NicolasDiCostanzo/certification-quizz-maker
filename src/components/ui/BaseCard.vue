<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  as?: string | Component
  tag?: 'div' | 'section' | 'article' | 'fieldset' | 'details'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'pill'
  bg?: 'surface' | 'bg' | 'none'
  shadow?: boolean
  borderTop?: boolean
  hoverable?: boolean
}>(), {
  tag: 'div',
  padding: 'md',
  radius: 'xl',
  bg: 'surface',
})

const resolvedTag = computed(() => props.as ?? props.tag)
</script>

<template>
  <component
    :is="resolvedTag"
    class="card"
    :class="[
      `card--padding-${padding}`,
      `card--radius-${radius}`,
      `card--bg-${bg}`,
      { 'card--shadow': shadow, 'card--border-top': borderTop, 'card--hoverable': hoverable },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
}

.card--padding-none { padding: 0; }
.card--padding-sm { padding: 12px; }
.card--padding-md { padding: 16px; }
.card--padding-lg { padding: 20px; }
.card--padding-xl { padding: 24px; }

.card--radius-none { border-radius: var(--radius-none); }
.card--radius-sm { border-radius: var(--radius-sm); }
.card--radius-md { border-radius: var(--radius-md); }
.card--radius-lg { border-radius: var(--radius-lg); }
.card--radius-xl { border-radius: var(--radius-xl); }
.card--radius-2xl { border-radius: var(--radius-2xl); }
.card--radius-3xl { border-radius: var(--radius-3xl); }
.card--radius-pill { border-radius: var(--radius-pill); }

.card--bg-none { background: transparent; }
.card--bg-bg { background: var(--bg); }

.card--shadow { box-shadow: var(--shadow); }

.card--border-top { border-top: 3px solid var(--accent); }

.card--hoverable:hover {
  border-color: var(--accent-border);
  background: var(--accent-bg);
}
</style>
