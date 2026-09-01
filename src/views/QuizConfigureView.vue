<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ChoiceGroup from '../components/ChoiceGroup.vue'
import CountPicker from '../components/CountPicker.vue'
import ThemeFilterGroup from '../components/ThemeFilterGroup.vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { texts } from '../texts/en'
import type { QuizMode, ReplayMode, ThemeGroupFilter, ThemeMatchMode } from '../types'
import { filterByReplay, filterByThemes, filterByTopics } from '../utils/filterPool'

const route = useRoute()
const { getCert, activePool } = useQuizLoader()

const certCode = computed(() => String(route.params.certCode))
const cert = computed(() => getCert(certCode.value))
const pool = computed(() => activePool(certCode.value))

const mode = ref<QuizMode>('preparation')
const replayMode = ref<ReplayMode>('all')
const count = ref<number | 'all'>('all')
const includeMatchMode = ref<ThemeMatchMode>('and')

const modeOptions: { value: QuizMode; label: string }[] = [
  { value: 'preparation', label: texts.modePreparation },
  { value: 'exam', label: texts.modeExam },
]

const replayOptions: { value: ReplayMode; label: string }[] = [
  { value: 'all', label: texts.replayAll },
  { value: 'wrong', label: texts.replayWrong },
  { value: 'flagged', label: texts.replayFlagged },
  { value: 'unattempted', label: texts.replayUnattempted },
]

const matchModeOptions: { value: ThemeMatchMode; label: string }[] = [
  { value: 'and', label: texts.matchAll },
  { value: 'or', label: texts.matchAny },
]

const includeGroups = reactive<Record<string, ThemeGroupFilter>>(
  Object.fromEntries(
    Object.keys(cert.value?.themes ?? {}).map((group): [string, ThemeGroupFilter] => [
      group,
      { values: [], match: 'all' },
    ]),
  ),
)
const excludeGroups = reactive<Record<string, ThemeGroupFilter>>(
  Object.fromEntries(Object.keys(cert.value?.themes ?? {}).map((group) => [group, { values: [], match: 'any' }])),
)
const selectedTopics = ref<string[]>([])

const availableTopics = computed(() => [...new Set(pool.value.map((question) => question.topic))])

const matchingCount = computed(() =>
  filterByReplay(
    filterByTopics(
      filterByThemes(pool.value, includeGroups, includeMatchMode.value, excludeGroups),
      selectedTopics.value,
    ),
    replayMode.value,
  ).length,
)
</script>

<template>
  <section v-if="cert" class="configure">
    <h1>{{ cert.exam.name }}</h1>

    <div class="configure-grid">
      <ChoiceGroup
        name="quiz-mode"
        :label="texts.modeLabel"
        :options="modeOptions"
        v-model="mode"
      />

      <ChoiceGroup
        name="replay-mode"
        :label="texts.replayLabel"
        :options="replayOptions"
        v-model="replayMode"
      />

      <CountPicker :max="matchingCount" v-model="count" />

      <ChoiceGroup
        name="include-match"
        :label="texts.matchChoiceLabel"
        :options="matchModeOptions"
        v-model="includeMatchMode"
      />

      <fieldset class="panel include-section">
        <legend>{{ texts.includeLabel }}</legend>
        <ThemeFilterGroup
          v-for="(values, group) in cert.themes"
          :key="`include-${group}`"
          :label="group"
          :values="values"
          :model-value="includeGroups[group]"
          :match-choice="true"
          :disabled-values="excludeGroups[group]?.values ?? []"
          @update:model-value="includeGroups[group] = $event"
        />
      </fieldset>

      <fieldset class="panel exclude-section">
        <legend>{{ texts.excludeLabel }}</legend>
        <ThemeFilterGroup
          v-for="(values, group) in cert.themes"
          :key="`exclude-${group}`"
          :label="group"
          :values="values"
          :model-value="{ values: excludeGroups[group]?.values ?? [], match: 'any' }"
          :match-choice="false"
          :disabled-values="includeGroups[group]?.values ?? []"
          @update:model-value="excludeGroups[group] = $event"
        />
      </fieldset>

      <fieldset class="panel topics-section">
        <legend>{{ texts.topicsLabel }}</legend>
        <ThemeFilterGroup
          :label="texts.topicsLabel"
          :values="availableTopics"
          :model-value="{ values: selectedTopics, match: 'any' }"
          :match-choice="false"
          @update:model-value="selectedTopics = $event.values"
        />
      </fieldset>
    </div>

    <p class="match-preview" :class="{ warning: matchingCount === 0 }">
      {{ matchingCount === 0 ? texts.noMatchWarning : texts.matchingCountValue(matchingCount) }}
    </p>

    <div class="cta-row">
      <button type="button" class="start-cta" disabled>{{ texts.startQuizCta }}</button>
      <span class="cta-hint">{{ texts.startQuizHint }}</span>
    </div>
  </section>
</template>

<style scoped>
.configure {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.configure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.panel legend {
  font-weight: 600;
  color: var(--text-h);
  padding: 0 4px;
}

.match-preview {
  margin: 0;
  font-weight: 600;
  color: var(--accent);
}

.match-preview.warning {
  color: var(--text-h);
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.start-cta {
  padding: 10px 18px;
  font: inherit;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  cursor: not-allowed;
}

.cta-hint {
  color: var(--text);
  font-size: 15px;
}

@media (max-width: 1024px) {
  .configure {
    gap: 14px;
  }

  .configure-grid {
    gap: 14px;
  }
}
</style>
