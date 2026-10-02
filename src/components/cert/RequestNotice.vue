<script setup lang="ts">
import { links } from '../../config';
import { texts } from '../../texts/en';

const ISSUES_URL = `${links.repo}/issues/new`
</script>

<template>
  <p class="request-notice">
    {{ texts.requestNoticeBefore }}
    <a :href="ISSUES_URL" target="_blank" rel="noopener noreferrer">{{ texts.requestNoticeLink }}</a>
  </p>
</template>

<style scoped>
.request-notice {
  color: var(--text);
  font-size: 15px;
}

.request-notice a {
  color: var(--accent);
}
</style>
