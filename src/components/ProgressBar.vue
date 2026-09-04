<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  passing: { type: Number, required: true },
})

const width = computed(() => `${props.value}%`)
const isPassed = computed(() => props.value >= props.passing)
</script>

<template>
  <div class="progress-bar">
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :class="{ 'progress-bar__fill--passed': isPassed }"
        :style="{ width }"
        :data-passed="isPassed"
      >
      {{ props.value }}%
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
