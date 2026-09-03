<script setup lang="ts">
import IconFlag from './icons/IconFlag.vue'

defineProps({
  questionId: { type: String, required: true },
  index: { type: Number, required: true },
  correct: { type: Boolean, required: true },
  flagged: { type: Boolean, required: true },
  selected: { type: Boolean, required: true },
})

defineEmits<{
  select: [questionId: string]
}>()
</script>

<template>
  <button
    type="button"
    class="summary-card"
    :class="{
      'summary-card--correct': correct,
      'summary-card--incorrect': !correct,
      'summary-card--selected': selected,
    }"
    :data-selected="selected"
    :data-correct="correct"
    :data-flagged="flagged"
    @click="$emit('select', questionId)"
  >
    <span class="summary-card__number">{{ index }}</span>
    <IconFlag
      v-if="flagged"
      class="summary-card__flag"
      width="14"
      height="14"
    />
  </button>
</template>

<style scoped>
.summary-card {
  position: relative;
  width: 48px;
  height: 48px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-h);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.summary-card:hover {
  border-color: var(--accent);
}

.summary-card--correct {
  background: color-mix(in srgb, var(--green) 15%, var(--surface));
  border-color: var(--green);
}

.summary-card--incorrect {
  background: color-mix(in srgb, var(--red) 15%, var(--surface));
  border-color: var(--red);
}

.summary-card--selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent);
}

.summary-card__flag {
  position: absolute;
  top: 2px;
  right: 2px;
  color: var(--accent);
}
</style>
