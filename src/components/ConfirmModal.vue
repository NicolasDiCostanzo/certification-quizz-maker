<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from 'vue'
import Card from './BaseCard.vue'
import PrimaryButton from './PrimaryButton.vue'
import SecondaryButton from './SecondaryButton.vue'

defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const titleId = useId()
const overlayRef = ref<HTMLElement | null>(null)
const previousActiveElement = ref<HTMLElement | null>(null)

function focusableElements(): HTMLElement[] {
  return overlayRef.value
    ? Array.from(overlayRef.value.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]'))
    : []
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('cancel')
    return
  }
  if (event.key !== 'Tab') return
  const elements = focusableElements()
  if (elements.length === 0) return
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  previousActiveElement.value = document.activeElement as HTMLElement | null
  focusableElements()[0]?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (previousActiveElement.value?.isConnected) {
    previousActiveElement.value.focus()
  }
})
</script>

<template>
  <div ref="overlayRef" class="modal-overlay" @click.self="emit('cancel')">
    <Card
      padding="xl"
      radius="2xl"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="modal"
    >
      <h2 :id="titleId">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <SecondaryButton @click="emit('cancel')">{{ cancelLabel }}</SecondaryButton>
        <PrimaryButton @click="emit('confirm')">{{ confirmLabel }}</PrimaryButton>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  max-width: 400px;
  width: 90%;
}

.modal h2 {
  margin: 0 0 12px;
  font-size: 18px;
  color: var(--text-h);
}

.modal p {
  margin: 0 0 20px;
  color: var(--text);
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
