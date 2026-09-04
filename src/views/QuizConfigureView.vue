<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChoiceGroup from '../components/ChoiceGroup.vue'
import CountPicker from '../components/CountPicker.vue'
import FilterOption from '../components/FilterOption.vue'
import ThemeFilter from '../components/ThemeFilter.vue'
import Card from '../components/BaseCard.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import { useUserProgressStore } from '../stores/userProgress'
import { texts } from '../texts/en'
import type { QuizConfig, QuizMode, ReplayMode, ThemeGroupFilter, ThemeMatchMode, ThemeRegistry } from '../types'
import { filterByReplay, filterByThemes, filterByTopics } from '../utils/filterPool'
import { sampleQuestions } from '../utils/sampling'

function emptyGroupFilters(themes: ThemeRegistry): Record<string, ThemeGroupFilter> {
  return Object.fromEntries(
    Object.keys(themes).map((group): [string, ThemeGroupFilter] => [group, { values: [], match: 'any' }]),
  )
}

  const route = useRoute()
  const router = useRouter()
  const { getCert, activePool } = useQuizLoader()
  const progressStore = useUserProgressStore()
  const quizSessionStore = useQuizSessionStore()

  const certCode = computed(() => String(route.params.certCode))
  const cert = computed(() => getCert(certCode.value))
  const pool = computed(() => activePool(certCode.value))

  const mode = ref<QuizMode>('preparation')
  const replayMode = ref<ReplayMode>('all')
  const count = ref<number | 'all'>(cert.value?.exam.totalQuestions ?? 'all')
  const includeMatchMode = ref<ThemeMatchMode>('or')

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
    emptyGroupFilters(cert.value?.themes ?? {}),
  )
  const excludeGroups = reactive<Record<string, ThemeGroupFilter>>(
    emptyGroupFilters(cert.value?.themes ?? {}),
  )
  const selectedTopics = ref<string[]>([])

  watch(certCode, () => {
    const themes = cert.value?.themes ?? {}
    for (const group of Object.keys(includeGroups)) delete includeGroups[group]
    Object.assign(includeGroups, emptyGroupFilters(themes))
    for (const group of Object.keys(excludeGroups)) delete excludeGroups[group]
    Object.assign(excludeGroups, emptyGroupFilters(themes))
    selectedTopics.value = []
    count.value = cert.value?.exam.totalQuestions ?? 'all'
  })

  const availableTopics = computed(() => [...new Set(pool.value.map((question) => question.topic))])

  const selectedGroupCount = computed(
    () => Object.values(includeGroups).filter((group) => group.values.length > 0).length,
  )

  const matchingCount = computed(() =>
    filterByReplay(
      filterByTopics(
        filterByThemes(pool.value, includeGroups, includeMatchMode.value, excludeGroups),
        selectedTopics.value,
      ),
      replayMode.value,
      progressStore.byExamCode[certCode.value] ?? {},
    ).length,
  )

  async function startQuiz() {
    const filtered = filterByReplay(
      filterByTopics(
        filterByThemes(pool.value, includeGroups, includeMatchMode.value, excludeGroups),
        selectedTopics.value,
      ),
      replayMode.value,
      progressStore.byExamCode[certCode.value] ?? {},
    )
    const questions = sampleQuestions(filtered, count.value, cert.value?.exam.weights)
    const initialFlags = questions
      .filter((q) => progressStore.isFlagged(certCode.value, q.id))
      .map((q) => q.id)
    const config: QuizConfig = {
      certCode: certCode.value,
      mode: mode.value,
      includeThemes: includeGroups,
      includeMatchMode: includeMatchMode.value,
      excludeThemes: excludeGroups,
      topics: selectedTopics.value,
      replayMode: replayMode.value,
      count: count.value,
    }
    quizSessionStore.startSession(certCode.value, config, questions, cert.value?.exam.timeLimitMinutes, initialFlags)
    await router.push({ name: 'quiz-session', params: { certCode: certCode.value } })
  }
</script>

<template>
  <section v-if="cert" class="configure-shell">
    <h1 class="page-title">{{ cert.exam.name }}</h1>

    <Card padding="xl" radius="3xl" shadow border-top class="config-card">
      <h2 class="section-title">{{ texts.quickSetupLabel }}</h2>
      <div class="quick-grid">
        <ChoiceGroup name="quiz-mode" :label="texts.modeLabel" :options="modeOptions" v-model="mode" />
        <ChoiceGroup name="replay-mode" :label="texts.replayLabel" :options="replayOptions" v-model="replayMode" />
        <CountPicker :max="matchingCount" v-model="count" />
      </div>
    </Card>

    <Card tag="details" padding="xl" radius="3xl" shadow border-top class="config-card filters-card">
      <summary class="section-title">{{ texts.filterQuestionsLabel }}</summary>
      <div class="advanced-grid">
        <div class="filter-col topics-section">
          <h3 class="col-heading">{{ texts.topicsLabel }}</h3>
          <ThemeFilter :values="availableTopics" :model-value="{ values: selectedTopics, match: 'any' }"
            :match-choice="false" :all-option="true" @update:model-value="selectedTopics = $event.values" />
        </div>

        <details class="filter-col include-section">
          <summary class="col-heading">{{ texts.includeLabel }}</summary>
          <div class="match-row" :class="{ 'match-row--disabled': selectedGroupCount < 2 }" role="radiogroup"
            :aria-label="texts.matchGroupsLabel">
            <FilterOption v-for="option in matchGroupsOptions" :key="option.value" class="pill" :text="option.label">
              <input type="radio" name="include-match" :disabled="selectedGroupCount < 2"
                :checked="includeMatchMode === option.value" @change="includeMatchMode = option.value" />
            </FilterOption>
          </div>
          <div class="filter-wrapper">
            <ThemeFilter v-for="(values, group) in cert.themes" :key="`include-${group}`" :label="group"
              :values="values" :model-value="includeGroups[group]" :match-choice="true"
              :disabled-values="excludeGroups[group]?.values ?? []"
              @update:model-value="includeGroups[group] = $event" />
          </div>

        </details>

        <details class="filter-col exclude-section">
          <summary class="col-heading">{{ texts.excludeLabel }}</summary>
          <div class="filter-wrapper">
            <ThemeFilter v-for="(values, group) in cert.themes" :key="`exclude-${group}`" :label="group"
              :values="values" :model-value="excludeGroups[group] ?? { values: [], match: 'any' }"
              :match-choice="false" :disabled-values="includeGroups[group]?.values ?? []"
              @update:model-value="excludeGroups[group] = $event" />
          </div>
        </details>
      </div>
    </Card>

    <footer class="config-footer">
      <p class="match-preview" :class="{ warning: matchingCount === 0 }">
        {{ matchingCount === 0 ? texts.noMatchWarning : texts.matchingCountValue(matchingCount) }}
      </p>
      <PrimaryButton pill ghost size="lg" :disabled="matchingCount === 0" @click="startQuiz">{{ texts.startQuizCta }}</PrimaryButton>
    </footer>
  </section>
</template>

<style scoped>
  .filter-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }

  .configure-shell {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: var(--text-h);
    text-align: center;
  }

  .config-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text);
  }

  summary.section-title {
    cursor: pointer;
    user-select: none;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  summary.section-title::-webkit-details-marker {
    display: none;
  }

  summary.section-title::before {
    content: '+';
    font-size: 16px;
    color: var(--accent);
  }

  details[open]>summary.section-title::before {
    content: '−';
  }

  .col-heading {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-h);
  }

  summary.col-heading {
    cursor: pointer;
    user-select: none;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  summary.col-heading::before {
    content: '−';
    color: var(--accent);
  }

  details:not([open])>summary.col-heading::before {
    content: '+';
  }

  .quick-grid,
  .advanced-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    align-items: start;
  }

  .advanced-grid {
    grid-template-columns: 280px 1fr 1fr;
  }

  .filter-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .include-section {
    border-left: 2px solid var(--green);
    padding-left: 16px;
  }

  .exclude-section {
    border-left: 2px solid var(--red);
    padding-left: 16px;
  }

  .match-row {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 8px;
  }

  .match-row--disabled {
    opacity: 0.5;
  }

  .match-row--disabled .pill {
    cursor: not-allowed;
  }

  .pill {
    position: relative;
    padding: 4px 14px;
    border: 1px solid var(--border);
    border-radius: 999px;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
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

  .config-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-top: 8px;
  }

  .match-preview {
    margin: 0;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    color: var(--accent);
  }

  .match-preview.warning {
    color: var(--text-h);
  }

  @media (max-width: 1024px) {
    .configure-shell {
      padding: 24px 16px 48px;
      gap: 20px;
    }

    .config-card.config-card {
      padding: 20px;
    }

    .quick-grid,
    .advanced-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
</style>
