<script setup lang="ts">
import { texts } from '../texts/en'
import type { CertBundle, ScoreResult } from '../types'
import type { ThemeBreakdown, TopicBreakdown } from '../utils/scoreBreakdown'
import ReviewBreakdown from './ReviewBreakdown.vue'
import ReviewScoreCard from './ReviewScoreCard.vue'

withDefaults(defineProps<{
  result: ScoreResult
  cert: CertBundle | undefined
  topicBreakdown: TopicBreakdown[]
  themeBreakdown: ThemeBreakdown[]
  themeGroups: string[]
  passingPercent: number
  showBanner?: boolean
}>(), {
  showBanner: true,
})
</script>

<template>
  <div class="review-summary">
    <div
      v-if="showBanner !== false"
      class="banner"
      :class="result.passed ? 'banner--passed' : 'banner--failed'"
    >
      {{ result.passed ? texts.passed : texts.failed }}
    </div>
    <ReviewScoreCard :result="result" :cert="cert" />
    <ReviewBreakdown
      :topic-breakdown="topicBreakdown"
      :theme-breakdown="themeBreakdown"
      :theme-groups="themeGroups"
      :passing-percent="passingPercent"
    />
  </div>
</template>

<style scoped>
.banner {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}

.banner--passed {
  background: color-mix(in srgb, var(--green) 15%, var(--surface));
  color: var(--green);
  border: 1px solid var(--green);
}

.banner--failed {
  background: color-mix(in srgb, var(--red) 15%, var(--surface));
  color: var(--red);
  border: 1px solid var(--red);
}
</style>
