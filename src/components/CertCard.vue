<script setup lang="ts">
import { texts } from '../texts/en'
import type { CertBundle } from '../types'
import { formatPassingScore } from '../utils/examDisplay'
import CertCodeBadge from './CertCodeBadge.vue'
import CertFact from './CertFact.vue'
import WeightPill from './WeightPill.vue'

defineProps<{ cert: CertBundle }>()
</script>

<template>
  <RouterLink
    class="cert-card"
    :to="{ name: 'quiz-dashboard', params: { certCode: cert.exam.code } }"
  >
    <h2>{{ cert.exam.name }}</h2>
    <CertCodeBadge :code="cert.exam.code" />
    <dl class="cert-facts">
      <CertFact :label="texts.questionBankLabel" :value="String(cert.questions.length)" />
      <CertFact :label="texts.realExamLabel" :value="texts.realExamValue(cert.exam.totalQuestions)" />
      <CertFact :label="texts.timeLimitLabel" :value="texts.timeLimitValue(cert.exam.timeLimitMinutes)" />
      <CertFact :label="texts.passingScoreLabel" :value="formatPassingScore(cert.exam.passingScore)" />
    </dl>
    <ul v-if="cert.exam.weights" class="cert-weights">
      <WeightPill v-for="(weight, topic) in cert.exam.weights" :key="topic" :topic="topic" :weight="weight" />
    </ul>
    <p v-if="cert.exam.instructions" class="cert-instructions">{{ cert.exam.instructions }}</p>
    <p class="cert-cta">{{ texts.viewDashboardCta }}</p>
  </RouterLink>
</template>

<style scoped>
.cert-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  box-shadow: var(--shadow);
  text-decoration: none;
  transition: border-color 0.15s ease;
}

.cert-card:hover {
  border-color: var(--accent-border);
  background: var(--accent-bg);
}

.cert-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px 16px;
  margin: 0;
}

.cert-weights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cert-instructions {
  font-size: 14px;
  color: var(--text);
  text-align: left;
}

.cert-cta {
  margin-top: auto;
  font-weight: 500;
  color: var(--accent);
}
</style>
