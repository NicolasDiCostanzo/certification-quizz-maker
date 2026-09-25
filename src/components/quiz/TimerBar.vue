<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  deadlineAt: number | undefined
}>()

const emit = defineEmits<{
  'time-up': []
}>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
const timeUpEmittedFor = ref<number | undefined>()

function start() {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 250)
}

function stop() {
  if (timer !== undefined) {
    clearInterval(timer)
    timer = undefined
  }
}

watch(() => props.deadlineAt, (deadline) => {
  stop()
  now.value = Date.now()
  if (deadline === undefined) {
    return
  }
  if (deadline <= now.value) {
    timeUpEmittedFor.value = deadline
    emit('time-up')
    return
  }
  timeUpEmittedFor.value = undefined
  start()
}, { immediate: true })

onBeforeUnmount(stop)

const remaining = computed(() => Math.max(0, (props.deadlineAt ?? 0) - now.value))

const formatted = computed(() => {
  const totalSeconds = Math.ceil(remaining.value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
})

const isLow = computed(() => remaining.value > 0 && remaining.value < 60_000)

watch(remaining, (value) => {
  if (value <= 0 && timeUpEmittedFor.value !== props.deadlineAt) {
    stop()
    timeUpEmittedFor.value = props.deadlineAt
    emit('time-up')
  }
})
</script>

<template>
  <div class="timer" :class="{ 'timer--low': isLow }">
    <span class="timer-icon">⏱</span>
    <span class="timer-value">{{ formatted }}</span>
  </div>
</template>

<style scoped>
.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--code-bg);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--text-h);
}

.timer--low {
  color: var(--red);
  animation: pulse 1s ease-in-out infinite;
}

.timer-icon {
  font-size: 18px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
