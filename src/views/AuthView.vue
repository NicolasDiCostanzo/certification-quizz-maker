<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
import { useAccount } from '../composables/useAccount'
import { texts } from '../texts/en'

const route = useRoute()
const { signUp, confirmSignUp, signIn } = useAccount()

const mode = ref<'signin' | 'signup'>(route.query.mode === 'signup' ? 'signup' : 'signin')
const step = ref<'credentials' | 'confirmation'>('credentials')
const email = ref('')
const password = ref('')
const code = ref('')
const busy = ref(false)
const error = ref<string | null>(null)

const isSignUp = computed(() => mode.value === 'signup')

async function submitCredentials() {
  busy.value = true
  error.value = null
  try {
    if (isSignUp.value) {
      const needsConfirmation = await signUp(email.value, password.value)
      if (needsConfirmation) {
        step.value = 'confirmation'
        return
      }
    }
    await signIn(email.value, password.value)
  } catch {
    error.value = isSignUp.value ? texts.authSignUpError : texts.authSignInError
  } finally {
    busy.value = false
  }
}

async function submitConfirmation() {
  busy.value = true
  error.value = null
  try {
    await confirmSignUp(email.value, code.value, password.value)
  } catch {
    error.value = texts.authConfirmError
  } finally {
    busy.value = false
  }
}

function switchMode() {
  mode.value = isSignUp.value ? 'signin' : 'signup'
  step.value = 'credentials'
  error.value = null
}
</script>

<template>
  <section id="center" class="auth">
    <BaseCard padding="lg" class="auth__card">
      <h1>{{ step === 'confirmation' ? texts.authConfirmTitle : isSignUp ? texts.authSignUpTitle : texts.authSignInTitle }}</h1>

      <form v-if="step === 'credentials'" class="auth__form" @submit.prevent="submitCredentials">
        <label class="auth__field">
          <span>{{ texts.authEmailLabel }}</span>
          <input v-model="email" type="email" required autocomplete="email" />
        </label>
        <label class="auth__field">
          <span>{{ texts.authPasswordLabel }}</span>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            :autocomplete="isSignUp ? 'new-password' : 'current-password'"
          />
        </label>
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
        <PrimaryButton type="submit" :disabled="busy" block>
          {{ isSignUp ? texts.authSignUpCta : texts.authSignInCta }}
        </PrimaryButton>
      </form>

      <form v-else class="auth__form" @submit.prevent="submitConfirmation">
        <p class="auth__hint">{{ texts.authConfirmHint }}</p>
        <label class="auth__field">
          <span>{{ texts.authConfirmCodeLabel }}</span>
          <input v-model="code" type="text" required inputmode="numeric" autocomplete="one-time-code" />
        </label>
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
        <PrimaryButton type="submit" :disabled="busy" block>{{ texts.authConfirmCta }}</PrimaryButton>
      </form>

      <button v-if="step === 'credentials'" type="button" class="auth__switch" @click="switchMode">
        {{ isSignUp ? texts.authSwitchToSignIn : texts.authSwitchToSignUp }}
      </button>
    </BaseCard>
  </section>
</template>

<style scoped>
.auth__card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth__card h1 {
  margin: 0;
  text-align: center;
  font-size: 22px;
  color: var(--text-h);
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth__hint {
  margin: 0;
  color: var(--text);
}

.auth__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth__field span {
  font-size: 14px;
  color: var(--text);
}

.auth__field input {
  font: inherit;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}

.auth__field input:focus {
  outline: none;
  border-color: var(--accent);
}

.auth__error {
  margin: 0;
  color: var(--red);
  font-size: 14px;
}

.auth__switch {
  font: inherit;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  text-decoration: underline;
  align-self: center;
}
</style>