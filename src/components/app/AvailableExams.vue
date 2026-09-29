<script setup lang="ts">
import { texts } from '../../texts/en'
import type { CertBundleMeta } from '../../types'
import CertCodeBadge from '../cert/CertCodeBadge.vue'
import Card from '../ui/BaseCard.vue'

defineProps<{ certs: CertBundleMeta[] }>()
</script>

<template>
  <Card tag="details" padding="lg" class="available-exams">
    <summary class="available-exams__summary">{{ texts.examsIncluded(certs.length) }}</summary>
    <ul class="available-exams__list">
      <li v-for="cert in certs" :key="cert.exam.code" class="available-exams__item">
        <span class="available-exams__name">{{ cert.exam.name }}</span>
        <span class="available-exams__meta">
          <CertCodeBadge :code="cert.exam.code" />
          <span class="available-exams__count">{{ texts.questionBankValue(cert.questionCount) }}</span>
        </span>
      </li>
    </ul>
  </Card>
</template>

<style scoped>
.available-exams {
  text-align: left;
}

.available-exams__summary {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  list-style: none;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text);
}

.available-exams__summary::-webkit-details-marker {
  display: none;
}

.available-exams__summary::before {
  content: '+';
  font-size: 16px;
  color: var(--accent);
}

.available-exams[open] .available-exams__summary::before {
  content: '−';
}

.available-exams__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.available-exams__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
}

.available-exams__name {
  font-size: 15px;
  color: var(--text-h);
}

.available-exams__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.available-exams__count {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
}
</style>
