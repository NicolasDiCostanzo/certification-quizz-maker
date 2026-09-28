<script setup lang="ts">
  import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ExternalLink from '../components/app/ExternalLink.vue';
import WelcomeCard from '../components/app/WelcomeCard.vue';
import IconCoffee from '../components/icons/IconCoffee.vue';
import IconGithub from '../components/icons/IconGithub.vue';
import { useAccount } from '../composables/useAccount';
import { isAuthAvailable, isSyncConfigured, links } from '../config';
import { useQuizHistoryStore } from '../stores/quizHistory';
import { useUserProgressStore } from '../stores/userProgress';
import { texts } from '../texts/en';

  const router = useRouter();
  const { continueLocal } = useAccount()
  const authAvailable = isAuthAvailable()
  const syncAvailable = isSyncConfigured()
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
    <div class="welcome__options">
      <template v-if="authAvailable">
        <WelcomeCard :title="texts.welcomeExistingAccount"
          :description="syncAvailable ? texts.welcomeExistingAccountDesc : texts.welcomeExistingAccountDescNoSync"
          :cta-label="texts.welcomeExistingAccountCta" @select="openSignIn" />
        <WelcomeCard :title="texts.welcomeNewAccount"
          :description="syncAvailable ? texts.welcomeNewAccountDesc : texts.welcomeNewAccountDescNoSync"
          :cta-label="texts.welcomeNewAccountCta" @select="openSignUp" />
      </template>
      <WelcomeCard variant="warning" :title="texts.welcomeNoAccount" :description="texts.welcomeNoAccountDesc"
        :cta-label="texts.welcomeNoAccountCta" @select="continueLocal" />
      <WelcomeCard v-if="authAvailable && syncAvailable && hasLocalData" :title="texts.welcomeUploadData"
        :description="texts.welcomeUploadDataDesc" :cta-label="texts.welcomeUploadDataCta" @select="openUpload" />
    </div>
    <div class="welcome__links">
      <ExternalLink :href="links.repo" :label="texts.githubLinkLabel">
        <template #icon><IconGithub /></template>
      </ExternalLink>
      <ExternalLink :href="links.sponsor" :label="texts.sponsorLinkLabel">
        <template #icon><IconCoffee /></template>
      </ExternalLink>
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

  .welcome__links {
    display: flex;
    align-items: center;
    gap: 3rem;
    margin-top: auto;
    padding-top: 25px;
  }

  @media (max-width: 1024px) {
    .welcome__options {
      max-width: 100%;
    }
  }
</style>