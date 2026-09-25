<script setup lang="ts">
defineProps<{
  type?: string
  label: string
  autocomplete?: string
  inputmode?: 'text' | 'numeric'
  minlength?: number
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="auth-field">
    <span>{{ label }}</span>
    <input
      v-model="model"
      :type="type ?? 'text'"
      required
      :minlength="minlength"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
    />
  </label>
</template>

<style scoped>
.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-field span {
  font-size: 14px;
  color: var(--text);
}

.auth-field input {
  font: inherit;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}

.auth-field input:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
