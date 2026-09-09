<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { isAuthAvailable } from '../config';
  import WelcomeCard from '../components/WelcomeCard.vue';
import { useAccount } from '../composables/useAccount';
import { useQuizHistoryStore } from '../stores/quizHistory';
import { useUserProgressStore } from '../stores/userProgress';
import { texts } from '../texts/en';

  const router = useRouter();
  const { continueLocal } = useAccount()
  const authAvailable = isAuthAvailable()
  const historyStore = useQuizHistoryStore();
  const progressStore = useUserProgressStore();
  const hasLocalData = computed(
    () => historyStore.entries.length > 0 || Object.keys(progressStore.byExamCode).length > 0,
  )

  function openSignIn() {
    router.push({ name: 'auth', query: { mode: 'signin' } })
  }

  function openSignUp() {
    router.push({ name: 'auth', query: { mode: 'signup' } })
  }

  function openUpload() {
    router.push({ name: 'auth', query: { mode: 'signin', upload: '1' } })
  }
</script>

<template>
  <section id="center" class="welcome">
    <h1>{{ texts.appTitle }}</h1>
    <div class="welcome__options">
      <template v-if="authAvailable">
        <WelcomeCard :title="texts.welcomeExistingAccount" :description="texts.welcomeExistingAccountDesc"
          :cta-label="texts.welcomeExistingAccountCta" @select="openSignIn" />
        <WelcomeCard :title="texts.welcomeNewAccount" :description="texts.welcomeNewAccountDesc"
          :cta-label="texts.welcomeNewAccountCta" @select="openSignUp" />
      </template>
      <WelcomeCard variant="warning" :title="texts.welcomeNoAccount" :description="texts.welcomeNoAccountDesc"
        :cta-label="texts.welcomeNoAccountCta" @select="continueLocal" />
      <WelcomeCard v-if="authAvailable && hasLocalData" :title="texts.welcomeUploadData"
        :description="texts.welcomeUploadDataDesc" :cta-label="texts.welcomeUploadDataCta" @select="openUpload" />
    </div>
  </section>
</template>

<style scoped>
  .welcome__options {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 600px;
  }

  @media (max-width: 1024px) {
    .welcome__options {
      max-width: 100%;
    }
  }
</style>