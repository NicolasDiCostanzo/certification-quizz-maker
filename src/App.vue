<script setup lang="ts">
import { texts } from './texts/en'
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-title">{{ texts.appTitle }}</RouterLink>
  </header>
  <main>
    <RouterView />
  </main>
</template>
