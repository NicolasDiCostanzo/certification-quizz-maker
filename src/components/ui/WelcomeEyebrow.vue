<script setup lang="ts">
  defineProps<{
    points: string[]
  }>()
</script>

<template>
  <ul class="eyebrow">
    <li v-for="point in points" :key="point" class="eyebrow__point">
      <svg class="eyebrow__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      <span>{{ point }}</span>
    </li>
  </ul>
</template>

<style scoped>
  .eyebrow {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: fit-content;
    margin: 0;
    padding: 16px 32px;
    list-style: none;
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-2xl);
    background: var(--accent-bg);
    box-shadow: var(--shadow);
  }

  .eyebrow__point {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-h);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1.1px;
    text-transform: uppercase;
  }

  .eyebrow__check {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    color: var(--accent);
  }

  @media (max-width: 720px) {
    .eyebrow {
      padding: 14px 24px;
    }

    .eyebrow__point {
      font-size: 12px;
      letter-spacing: 1px;
    }
  }
</style>
