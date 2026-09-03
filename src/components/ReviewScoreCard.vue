<script setup lang="ts">
import type { CertBundle, ScoreResult } from '../types'
import { texts } from '../texts/en'

defineProps<{
  result: ScoreResult
  cert: CertBundle | undefined
}>()
</script>

<template>
  <div class="score-card">
    <div class="score-card__percent">{{ Math.round(result.percentCorrect) }}%</div>
    <div class="score-card__detail">
      <p>{{ texts.correctCount(result.timesCorrect, result.totalAnswered) }}</p>
      <p v-if="result.projectedScaledScore !== undefined && cert?.exam.passingScore.scale" class="score-card__scaled">
        {{ texts.projectedScaledScore(result.projectedScaledScore, cert.exam.passingScore.scale) }}
      </p>
      <p v-if="result.projectedScaledScore !== undefined" class="score-card__disclaimer">
        {{ texts.scaledScoreDisclaimer }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.score-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 24px;
}

.score-card__percent {
  font-size: 48px;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1;
}

.score-card__detail p {
  margin: 0;
  color: var(--text);
}

.score-card__scaled {
  font-weight: 600;
  color: var(--text-h);
}

.score-card__disclaimer {
  font-size: 12px;
  color: var(--text);
  opacity: 0.7;
  margin-top: 4px;
}
</style>
