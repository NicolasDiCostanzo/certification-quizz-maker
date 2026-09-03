<script setup lang="ts">
import { computed, ref } from 'vue';
import { texts } from '../texts/en';
import type { ThemeBreakdown, TopicBreakdown } from '../utils/scoreBreakdown';
import { groupLabel } from '../utils/themeGroupLabel';
import ProgressBar from './ProgressBar.vue';

const props = defineProps<{
  topicBreakdown: TopicBreakdown[]
  themeBreakdown: ThemeBreakdown[]
  themeGroups: string[]
  passingPercent: number
}>()

const openThemeGroups = ref<Record<string, boolean>>({})
const themeSectionOpen = ref(true)

function isThemeGroupOpen(group: string): boolean {
  return openThemeGroups.value[group] ?? false
}

function toggleThemeGroup(group: string) {
  openThemeGroups.value[group] = !isThemeGroupOpen(group)
}

const themeBreakdownByGroup = computed(() => {
  const map: Record<string, ThemeBreakdown[]> = {}
  for (const item of props.themeBreakdown) {
    const list = map[item.group] ?? []
    list.push(item)
    map[item.group] = list
  }
  return map
})

const visibleThemeGroups = computed(() =>
  props.themeGroups.filter(group => (themeBreakdownByGroup.value[group]?.length ?? 0) > 0)
)
</script>

<template>
  <section v-if="topicBreakdown.length" class="breakdown">
    <h2>{{ texts.scoreBreakdownByTopic }}</h2>
    <div v-for="item in topicBreakdown" :key="item.label" class="breakdown__row">
      <span class="breakdown__label">{{ item.label }}</span>
      <span class="breakdown__fraction">{{ item.correct }} / {{ item.total }}</span>
      <span class="breakdown__percent">{{ item.percent }}%</span>
      <ProgressBar :value="item.percent" :passing="passingPercent" />
    </div>
  </section>

  <section v-if="themeBreakdown.length" class="breakdown">
      <h2 class="breakdown__title">{{ texts.scoreBreakdownByTheme }}</h2>
    <div v-show="themeSectionOpen" class="breakdown__section-content">
      <div v-for="group in visibleThemeGroups" :key="group" class="breakdown__group">
        <button class="breakdown__group-toggle" @click="toggleThemeGroup(group)">
          <span class="breakdown__group-label">{{ groupLabel(group) }}</span>
          <span class="breakdown__chevron" :class="{ 'breakdown__chevron--open': isThemeGroupOpen(group) }">▼</span>
        </button>
        <div v-if="isThemeGroupOpen(group)" class="breakdown__group-content">
          <div v-for="item in themeBreakdownByGroup[group]" :key="item.value" class="breakdown__row">
            <span class="breakdown__label">{{ item.value }}</span>
            <span class="breakdown__fraction">{{ item.correct }} / {{ item.total }}</span>
            <span class="breakdown__percent">{{ item.percent }}%</span>
            <ProgressBar :value="item.percent" :passing="passingPercent" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.breakdown {
  margin-bottom: 24px;
}

.breakdown h2 {
  font-size: 18px;
  color: var(--text-h);
  margin: 0 0 12px;
}

.breakdown__row {
  display: grid;
  grid-template-columns: 1fr 80px 50px 200px;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

@media (max-width: 500px) {
  .breakdown__row {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'label label'
      'fraction bar';
    gap: 4px 8px;
  }

  .breakdown__row .breakdown__label {
    grid-area: label;
  }

  .breakdown__row .breakdown__fraction {
    grid-area: fraction;
    text-align: left;
  }

  .breakdown__row .breakdown__percent {
    display: none;
  }

  .breakdown__row > :last-child {
    grid-area: bar;
  }
}

.breakdown__label {
  color: var(--text-h);
  font-weight: 500;
  text-align: left;
}

.breakdown__fraction,
.breakdown__percent {
  color: var(--text);
  font-size: 14px;
  text-align: left;
}

.breakdown__title {
  font-size: 18px;
  color: var(--text-h);
  margin: 0 0 12px;
}

.breakdown__section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
  margin: 0 0 12px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.breakdown__section-toggle .breakdown__title {
  margin: 0;
}

.breakdown__section-content {
  padding-top: 4px;
}

.breakdown__group {
  margin-bottom: 16px;
}

.breakdown__group-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
  margin: 0 0 8px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.breakdown__group-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
}

.breakdown__chevron {
  font-size: 12px;
  color: var(--text);
  transition: transform 0.2s ease;
}

.breakdown__chevron--open {
  transform: rotate(180deg);
}
</style>
