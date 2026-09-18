<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthLinkButton from '../components/AuthLinkButton.vue'
import AuthTextField from '../components/AuthTextField.vue'
import BaseCard from '../components/BaseCard.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
import { useAccount } from '../composables/useAccount'
import { texts } from '../texts/en'

const route = useRoute()
const { signUp, confirmSignUp, resendConfirmationCode, requestPasswordReset, confirmPasswordReset, signIn } = useAccount()

const uploadAfterAuth = route.query.upload === '1'

const mode = ref<'signin' | 'signup'>(route.query.mode === 'signup' ? 'signup' : 'signin')
const step = ref<'credentials' | 'confirmation' | 'resetRequest' | 'resetConfirm'>('credentials')
const email = ref('')
const password = ref('')
const code = ref('')
const newPassword = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

const isSignUp = computed(() => mode.value === 'signup')

const title = computed(() => {
  if (step.value === 'confirmation') return texts.authConfirmTitle
  if (step.value === 'resetRequest') return texts.authResetTitle
  if (step.value === 'resetConfirm') return texts.authResetConfirmTitle
  return isSignUp.value ? texts.authSignUpTitle : texts.authSignInTitle
})

async function resumeConfirmation() {
  try {
    await resendConfirmationCode(email.value)
  } catch {
    error.value = texts.authResendError
    return
  }
  step.value = 'confirmation'
  notice.value = texts.authCodeResent
}

async function recoverExistingAccount() {
  try {
    await signIn(email.value, password.value, { migrateGuest: uploadAfterAuth })
  } catch (err) {
    if (err instanceof Error && err.name === 'UserNotConfirmedException') {
      await resumeConfirmation()
    } else {
      step.value = 'confirmation'
    }
  }
}

function handleCredentialsFailure(err: unknown) {
  const name = err instanceof Error ? err.name : ''
  if (isSignUp.value && name === 'InvalidPasswordException') {
    error.value = texts.authWeakPasswordError
    return
  }
  if (name === 'UserNotConfirmedException') {
    step.value = 'confirmation'
    notice.value = texts.authUnconfirmedNotice
    return
  }
  error.value = isSignUp.value ? texts.authSignUpError : texts.authSignInError
}

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
    await signIn(email.value, password.value, { migrateGuest: uploadAfterAuth })
  } catch (err) {
    if (err instanceof Error && err.name === 'UsernameExistsException') {
      await recoverExistingAccount()
    } else {
      handleCredentialsFailure(err)
    }
  } finally {
    busy.value = false
  }
}

async function submitConfirmation() {
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await confirmSignUp(email.value, code.value, password.value, { migrateGuest: uploadAfterAuth })
  } catch (err) {
    if (err instanceof Error && err.name === 'ConfirmAutoSignInError') {
      code.value = ''
      mode.value = 'signin'
      step.value = 'credentials'
      notice.value = texts.authConfirmCompleted
    } else {
      error.value = texts.authConfirmError
    }
  } finally {
    busy.value = false
  }
}

async function startConfirmation() {
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await resumeConfirmation()
  } finally {
    busy.value = false
  }
}

async function submitResetRequest() {
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await requestPasswordReset(email.value)
    step.value = 'resetConfirm'
  } catch {
    error.value = texts.authResetRequestError
  } finally {
    busy.value = false
  }
}

async function submitResetConfirm() {
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await confirmPasswordReset(email.value, code.value, newPassword.value, { migrateGuest: uploadAfterAuth })
  } catch (err) {
    if (err instanceof Error && err.name === 'InvalidPasswordException') {
      error.value = texts.authWeakPasswordError
    } else if (err instanceof Error && err.name === 'ResetAutoSignInError') {
      password.value = ''
      step.value = 'credentials'
      notice.value = texts.authResetCompleted
    } else {
      error.value = texts.authResetConfirmError
    }
  } finally {
    busy.value = false
  }
}

async function resendCode() {
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await resendConfirmationCode(email.value)
    notice.value = texts.authCodeResent
  } catch {
    error.value = texts.authResendError
  } finally {
    busy.value = false
  }
}

function switchMode() {
  mode.value = isSignUp.value ? 'signin' : 'signup'
  step.value = 'credentials'
  error.value = null
  notice.value = null
}

function startReset() {
  step.value = 'resetRequest'
  code.value = ''
  newPassword.value = ''
  error.value = null
  notice.value = null
}

function backToSignIn() {
  step.value = 'credentials'
  code.value = ''
  newPassword.value = ''
  error.value = null
  notice.value = null
}
</script>

<template>
  <section id="center" class="auth">
    <BaseCard padding="lg" class="auth__card">
      <h1>{{ title }}</h1>

      <form v-if="step === 'credentials'" class="auth__form" @submit.prevent="submitCredentials">
        <AuthTextField v-model="email" type="email" :label="texts.authEmailLabel" autocomplete="email" />
        <AuthTextField
          v-model="password"
          type="password"
          :label="texts.authPasswordLabel"
          :minlength="6"
          :autocomplete="isSignUp ? 'new-password' : 'current-password'"
        />
        <p v-if="uploadAfterAuth" class="auth__hint">{{ texts.authUploadHint }}</p>
        <p v-if="notice" class="auth__notice" role="status">{{ notice }}</p>
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
        <PrimaryButton type="submit" :disabled="busy" block>
          {{ isSignUp ? texts.authSignUpCta : texts.authSignInCta }}
        </PrimaryButton>
        <AuthLinkButton v-if="!isSignUp" :disabled="busy" @click="startReset">
          {{ texts.authSwitchToReset }}
        </AuthLinkButton>
        <AuthLinkButton v-if="!isSignUp" :disabled="busy" @click="startConfirmation">
          {{ texts.authSwitchToConfirm }}
        </AuthLinkButton>
      </form>

      <form v-else-if="step === 'confirmation'" class="auth__form" @submit.prevent="submitConfirmation">
        <p class="auth__hint">{{ texts.authConfirmHint }}</p>
        <AuthTextField
          v-model="code"
          type="text"
          :label="texts.authConfirmCodeLabel"
          autocomplete="one-time-code"
          inputmode="numeric"
        />
        <p v-if="notice" class="auth__notice" role="status">{{ notice }}</p>
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
        <PrimaryButton type="submit" :disabled="busy" block>{{ texts.authConfirmCta }}</PrimaryButton>
        <AuthLinkButton :disabled="busy" @click="resendCode">{{ texts.authResendCode }}</AuthLinkButton>
      </form>

      <form v-else-if="step === 'resetRequest'" class="auth__form" @submit.prevent="submitResetRequest">
        <p class="auth__hint">{{ texts.authResetHint }}</p>
        <AuthTextField v-model="email" type="email" :label="texts.authEmailLabel" autocomplete="email" />
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
        <PrimaryButton type="submit" :disabled="busy" block>{{ texts.authResetCta }}</PrimaryButton>
        <AuthLinkButton :disabled="busy" @click="backToSignIn">{{ texts.authSwitchToSignIn }}</AuthLinkButton>
      </form>

      <form v-else class="auth__form" @submit.prevent="submitResetConfirm">
        <p class="auth__hint">{{ texts.authResetConfirmHint }}</p>
        <AuthTextField
          v-model="code"
          type="text"
          :label="texts.authConfirmCodeLabel"
          autocomplete="one-time-code"
          inputmode="numeric"
        />
        <AuthTextField
          v-model="newPassword"
          type="password"
          :label="texts.authNewPasswordLabel"
          :minlength="6"
          autocomplete="new-password"
        />
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
        <PrimaryButton type="submit" :disabled="busy" block>{{ texts.authResetConfirmCta }}</PrimaryButton>
        <AuthLinkButton :disabled="busy" @click="backToSignIn">{{ texts.authSwitchToSignIn }}</AuthLinkButton>
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

.auth__notice {
  margin: 0;
  color: var(--green);
  font-size: 14px;
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