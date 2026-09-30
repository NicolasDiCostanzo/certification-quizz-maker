<script setup lang="ts">
  import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PrimaryButton from '../components/ui/PrimaryButton.vue'
import { useUserAccountStore } from '../stores/userAccount'
import { texts } from '../texts/en'

  const route = useRoute()
  const router = useRouter()
  const account = useUserAccountStore()

  const requestedPath = computed(() => route.fullPath)

  const homeTarget = computed(() => (account.accountMode === 'account' ? '/cert' : '/'))

  function goHome() {
    router.push(homeTarget.value)
  }
</script>

<template>
  <section id="center" class="not-found">
    <p class="not-found__code" aria-hidden="true">404</p>
    <div class="not-found__intro">
      <h1>{{ texts.notFoundTitle }}</h1>
      <p>{{ texts.notFoundDescription }}</p>
    </div>
    <p class="not-found__path">
      <span class="not-found__path-label">{{ texts.notFoundPathLabel }}</span>
      <code>{{ requestedPath }}</code>
    </p>
    <div class="not-found__actions">
      <PrimaryButton size="lg" @click="goHome">{{ texts.notFoundHomeCta }}</PrimaryButton>
    </div>
  </section>
</template>

<style scoped>
  .not-found__intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    max-width: 520px;
  }

  .not-found__code {
    margin: 0;
    font-family: var(--heading);
    font-size: 72px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -3px;
    color: var(--brand);
  }

  .not-found__intro h1 {
    margin: 0;
    font-size: 28px;
    letter-spacing: -0.6px;
    line-height: 118%;
  }

  .not-found__intro p {
    margin: 0;
    color: var(--text-h);
    font-size: 17px;
    font-weight: 600;
    line-height: 150%;
    text-wrap: balance;
    max-width: 44ch;
  }

  .not-found__path {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    text-align: left;
  }

  .not-found__path-label {
    flex-shrink: 0;
    color: var(--text);
    font-size: 13px;
  }

  .not-found__path code {
    font-size: 13px;
    color: var(--text-h);
    overflow-wrap: anywhere;
  }

  .not-found__actions {
    margin-top: 10rem;
  }

  @media (max-width: 1024px) {
    .not-found__code {
      font-size: 56px;
    }

    .not-found__intro h1 {
      font-size: 24px;
    }

    .not-found__intro p {
      font-size: 16px;
    }
  }
</style>
