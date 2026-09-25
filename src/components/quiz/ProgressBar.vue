<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  passing: { type: Number, required: true },
})

const normalizedValue = computed(() => {
  const v = props.value
  if(!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v))
})

const width = computed(() => `${normalizedValue.value}%`)
const isPassed = computed(() => normalizedValue.value >= props.passing)
</script>

<template>
  <div class="progress-bar">
    <div
      class="progress-bar__track"
      role="progressbar"
      :aria-valuenow="normalizedValue"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="progress-bar__fill"
        :class="{ 'progress-bar__fill--passed': isPassed }"
        :style="{ width }"
        :data-passed="isPassed"
      >
      {{ normalizedValue }}%
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar {
  width: 100%;
  height: 24px;
}

.progress-bar__track {
  width: 100%;
  height: 100%;
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background-color: var(--red);
  transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-bar__fill--passed {
  background-color: var(--green);
}
</style>
