<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ChoiceGroup from '../components/ChoiceGroup.vue'
import CountPicker from '../components/CountPicker.vue'
import FilterOption from '../components/FilterOption.vue'
import ThemeFilter from '../components/ThemeFilter.vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { texts } from '../texts/en'
import type { QuizMode, ReplayMode, ThemeGroupFilter, ThemeMatchMode } from '../types'
import { filterByReplay, filterByThemes, filterByTopics } from '../utils/filterPool'
import { groupLabel } from '../utils/themeGroupLabel'

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

const matchGroupsOptions: { value: ThemeMatchMode; label: string }[] = [
  { value: 'and', label: texts.matchAllGroups },
  { value: 'or', label: texts.matchAnyGroups },
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

const multipleGroupsSelected = computed(
  () => Object.values(includeGroups).filter((group) => group.values.length > 0).length >= 2,
)
</script>

<template>
  <section v-if="cert" class="configure">
    <h1>{{ cert.exam.name }}</h1>

    <section class="config-section">
      <h2 class="section-title">{{ texts.quickSetupLabel }}</h2>
      <div class="quick-grid">
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
      </div>
    </section>

    <section class="config-section">
      <h2 class="section-title">{{ texts.filterQuestionsLabel }}</h2>
      <div class="advanced-grid">
        <div class="panel topics-section">
          <ThemeFilter :label="texts.topicsLabel" :values="availableTopics"
            :model-value="{ values: selectedTopics, match: 'any' }" :match-choice="false"
            @update:model-value="selectedTopics = $event.values" />
        </div>

        <div class="panel include-section">
          <h3 class="panel-heading">{{ texts.includeLabel }}</h3>
          <div v-if="multipleGroupsSelected" class="match-row" role="radiogroup" :aria-label="texts.matchGroupsLabel">
            <FilterOption
              v-for="option in matchGroupsOptions"
              :key="option.value"
              class="pill"
              :text="option.label"
            >
              <input
                type="radio"
                name="include-match"
                :checked="includeMatchMode === option.value"
                @change="includeMatchMode = option.value"
              />
            </FilterOption>
          </div>
          <ThemeFilter
            v-for="(values, group) in cert.themes"
            :key="`include-${group}`"
            :label="groupLabel(group)"
            :values="values"
            :model-value="includeGroups[group]"
            :match-choice="true"
            :disabled-values="excludeGroups[group]?.values ?? []"
            @update:model-value="includeGroups[group] = $event"
          />
        </div>

        <div class="panel exclude-section">
          <h3 class="panel-heading">{{ texts.excludeLabel }}</h3>
          <ThemeFilter
            v-for="(values, group) in cert.themes"
            :key="`exclude-${group}`"
            :label="groupLabel(group)"
            :values="values"
            :model-value="{ values: excludeGroups[group]?.values ?? [], match: 'any' }"
            :match-choice="false"
            :disabled-values="includeGroups[group]?.values ?? []"
            @update:model-value="excludeGroups[group] = $event"
          />
        </div>
      </div>
    </section>

    <footer class="config-section-footer">   
      <p class="match-preview" :class="{ warning: matchingCount === 0 }">
        {{ matchingCount === 0 ? texts.noMatchWarning : texts.matchingCountValue(matchingCount) }}
      </p>
      
      <div class="cta-row">
        <button type="button" class="start-cta" disabled>{{ texts.startQuizCta }}</button>
      </div>
    </footer>
    </section>
</template>

<style scoped>
.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  margin: 1.5rem;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text);
}

.quick-grid,
.advanced-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  align-items: start;
}

.match-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pill {
  position: relative;
  padding: 4px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.pill:has(input:checked) {
  color: var(--text-h);
  background: var(--accent-bg);
  border-color: var(--accent-border);
}

.pill input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.match-preview {
  margin: 0;
  font-weight: 600;
  text-align: left;
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
  .config-section {
    gap: 10px;
  }

  .quick-grid,
  .advanced-grid {
    gap: 14px;
  }
}

.config-section-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin: 2rem 0;
}
</style>
