<script setup lang="ts">
  import WelcomeCard from '../components/WelcomeCard.vue';
import { useAccount } from '../composables/useAccount';
import { texts } from '../texts/en';

  const { createAccount, signIn, continueLocal } = useAccount()
</script>

<template>
  <section id="center" class="welcome">
    <h1>{{ texts.appTitle }}</h1>
    <div class="welcome__options">
      <WelcomeCard :title="texts.welcomeExistingAccount" :description="texts.welcomeExistingAccountDesc"
        :cta-label="texts.welcomeExistingAccountCta" @select="signIn" />
      <WelcomeCard :title="texts.welcomeNewAccount" :description="texts.welcomeNewAccountDesc"
        :cta-label="texts.welcomeNewAccountCta" @select="createAccount" />
      <WelcomeCard variant="warning" :title="texts.welcomeNoAccount" :description="texts.welcomeNoAccountDesc"
        :cta-label="texts.welcomeNoAccountCta" @select="continueLocal" />
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