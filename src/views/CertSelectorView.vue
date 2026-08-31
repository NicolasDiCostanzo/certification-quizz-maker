<script setup lang="ts">
import CertSelector from '../components/CertSelector.vue';
import { useQuizLoader } from '../composables/useQuizLoader';

const { availableCerts } = useQuizLoader()
</script>

<template>
  <section id="center">
    <CertSelector :certs="availableCerts" />
  </section>
</template>