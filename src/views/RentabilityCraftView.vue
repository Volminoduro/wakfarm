<template>
  <div>
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav class="flex items-center border-b cf-bg-secondary cf-border-primary">
        <button
          @click="subTab = 'kamas'"
          :class="['cf-tab', subTab === 'kamas' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'kamas' ? 'text-shadow: var(--active-tab-text-shadow);' : ''"
        >
          {{ $t('divers.tab_craft_kamas') || 'Kamas / craft' }}
        </button>

        <button
          @click="subTab = 'jobs'"
          :class="['cf-tab', subTab === 'jobs' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'jobs' ? 'text-shadow: var(--active-tab-text-shadow);' : ''"
        >
          {{ $t('divers.nav_configuration') || 'Configuration' }}
        </button>
      </nav>
    </div>

    <FloatingFilter />

    <div v-if="subTab === 'kamas'" class="cf-section-header">
      <ToggleAllButton
        :isExpanded="allCraftCardsExpanded"
        @toggle="toggleAllCraftCards"
      />
    </div>

    <div v-if="subTab === 'kamas'" class="cf-page">
      <div v-if="jsonStore.loaded && craftJobCards.length === 0" class="cf-empty-state">
        <p class="cf-text-secondary">
          {{ $t('divers.harvest_no_resource_for_level') || 'Aucune ressource rentable pour ce niveau.' }}
        </p>
      </div>
      <div v-else-if="jsonStore.loaded">
        <div class="px-8 py-4 mb-6 rounded-lg cf-bg-secondary cf-border-primary border text-sm leading-relaxed">
          <p class="cf-text-primary mb-2 font-semibold">{{ $t('divers.craft_kamas_info_title') || 'About this calculation' }}</p>
          <p class="cf-text-secondary">{{ $t('divers.craft_kamas_info_desc') || 'This tab calculates the profit per craft by buying all required ingredients from the collective market.' }}</p>
          <p class="cf-text-secondary mt-1">{{ $t('divers.craft_kamas_info_missing_price_rule') || 'A craft is excluded if at least one ingredient has no price.' }}</p>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <HarvestJobCard
            v-for="card in craftJobCards"
            :key="`craft-${card.skillId}`"
            :skill-id="card.skillId"
            :job-label="card.label"
            :job-level="card.level"
            :total-kamas="card.totalKamas"
            :kamas-per-hour="card.kamasPerHour"
            :used-seconds="card.usedSeconds"
            :unused-seconds="card.unusedSeconds"
            :picks="card.picks"
            :expanded-storage-key="LS_KEYS.EXPANDED_CRAFT_JOBS"
            :show-quantity-details="false"
          />
        </div>
      </div>
    </div>

    <div v-else class="px-8 py-6 max-w-240 mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="job in craftJobsDefinitions"
          :key="job.skillId"
          class="border rounded-lg p-4 cf-bg-secondary cf-border-primary"
        >
          <h3 class="font-semibold mb-3 cf-text-primary flex items-center gap-2">
            <JobIcon :job-id="job.skillId" />
            <span>{{ job.label }}</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-1 gap-3">
            <div>
              <label class="block text-xs font-medium mb-1 cf-text-secondary">{{ $t('divers.harvest_job_level') || 'Niveau métier' }}</label>
              <input
                type="number"
                :value="craftJobsConfig[job.skillId]?.level ?? 0"
                @input="(event) => validateCraftLevel(job.skillId, event)"
                class="cf-input w-24 text-center"
                min="0"
                max="245"
              >
            </div>
          </div>

          <div v-if="(craftPlanRowsByJob.get(job.skillId) || []).length" class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <div class="text-xs font-medium cf-text-secondary">
                {{ $t('divers.craft_plans_title') || 'Plans learned' }}
              </div>
              <div class="flex gap-1">
                <button
                  @click="selectAllPlansForJob(job.skillId)"
                  class="px-2 py-1 text-xs rounded cf-bg-primary cf-text-secondary hover:cf-bg-secondary transition"
                  :title="$t('divers.level_ranges_toggle_all') || 'Check all'"
                >
                  ✓
                </button>
                <button
                  @click="deselectAllPlansForJob(job.skillId)"
                  class="px-2 py-1 text-xs rounded cf-bg-primary cf-text-secondary hover:cf-bg-secondary transition"
                  :title="$t('divers.level_ranges_toggle_none') || 'Uncheck all'"
                >
                  ✕
                </button>
              </div>
            </div>

            <div class="mt-2 space-y-2 max-h-64 overflow-y-auto pr-2">
              <label
                v-for="plan in craftPlanRowsByJob.get(job.skillId)"
                :key="`plan-${job.skillId}-${plan.recipeId}`"
                class="flex items-start gap-2 text-xs"
              >
                <input
                  type="checkbox"
                  class="mt-0.5"
                  :checked="(learnedPlanSetsByJob.get(job.skillId) || new Set()).has(plan.recipeId)"
                  @change="toggleLearnedPlan(job.skillId, plan.recipeId)"
                >
                <span class="leading-snug">
                  <span :class="getRarityClass(jsonStore.itemRarityMap[plan.resultItemId])">
                    {{ $t(`items.${plan.resultItemId}`) || `#${plan.resultItemId}` }}
                  </span>
                  <span class="ml-1 cf-text-secondary">Lvl. {{ plan.levelRequired || 0 }}</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { LEVEL_RANGES } from '@/constants'
import JobIcon from '@/components/JobIcon.vue'
import HarvestJobCard from '@/components/Harvest/HarvestJobCard.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'
import FloatingFilter from '@/components/FloatingFilter.vue'
import { clampInteger } from '@/utils/harvestProfit'
import { selectCraftPicks } from '@/utils/craftProfit'
import { getRarityClass } from '@/utils/itemHelpers'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const appStore = useAppStore()
const jsonStore = useJsonStore()

const CRAFT_JOB_IDS = [40, 76, 77, 78, 79, 80, 81, 83]

const subTab = useLocalStorage(LS_KEYS.CRAFT_SUBTAB, 'kamas')
const craftJobsConfig = useLocalStorage(LS_KEYS.CRAFT_JOBS_CONFIG, {}, { deep: true })
const expandedCraftJobs = useLocalStorage(LS_KEYS.EXPANDED_CRAFT_JOBS, [])
const learnedPlans = useLocalStorage(LS_KEYS.CRAFT_LEARNED_PLANS, {}, { deep: true })

const craftJobsDefinitions = computed(() => {
  const rawCrafts = Array.isArray(jsonStore.rawCrafts) ? jsonStore.rawCrafts : []
  const availableSkillIds = [...new Set(rawCrafts.map(craft => Number(craft.jobId)).filter(id => Number.isFinite(id) && id > 0))]

  const ordered = [
    ...CRAFT_JOB_IDS.filter(id => availableSkillIds.includes(id)),
    ...availableSkillIds.filter(id => !CRAFT_JOB_IDS.includes(id)).sort((a, b) => a - b)
  ]

  return ordered.map(skillId => ({
    skillId,
    label: t(`divers.harvest_job_skill_${skillId}`) || `Métier #${skillId}`
  }))
})

function ensureCraftJobConfig(skillId) {
  if (!craftJobsConfig.value[skillId]) {
    craftJobsConfig.value[skillId] = { level: 0 }
  }
}

function validateCraftLevel(skillId, event) {
  ensureCraftJobConfig(skillId)
  craftJobsConfig.value[skillId].level = clampInteger(event?.target?.value, 0, 245, false)
}

function getCraftLevel(skillId) {
  return clampInteger(craftJobsConfig.value?.[skillId]?.level, 0, 245, false)
}

const learnedPlanSetsByJob = computed(() => {
  const map = new Map()
  const raw = learnedPlans.value || {}
  Object.entries(raw).forEach(([jobKey, recipeIds]) => {
    const skillId = Number(jobKey)
    if (!Number.isFinite(skillId)) return
    const normalized = (Array.isArray(recipeIds) ? recipeIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id))
    map.set(skillId, new Set(normalized))
  })
  return map
})

function toggleLearnedPlan(jobId, recipeId) {
  const jobKey = String(jobId)
  if (!learnedPlans.value[jobKey]) learnedPlans.value[jobKey] = []
  const list = learnedPlans.value[jobKey]
  const normalizedId = Number(recipeId)
  const index = list.indexOf(normalizedId)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    if (Number.isFinite(normalizedId)) list.push(normalizedId)
  }
  learnedPlans.value = { ...learnedPlans.value, [jobKey]: [...list] }
}

function selectAllPlansForJob(jobId) {
  const jobKey = String(jobId)
  const plans = craftPlanRowsByJob.value.get(jobId) || []
  const recipeIds = plans
    .map(p => Number(p.recipeId))
    .filter(id => Number.isFinite(id))
  learnedPlans.value = { ...learnedPlans.value, [jobKey]: recipeIds }
}

function deselectAllPlansForJob(jobId) {
  const jobKey = String(jobId)
  learnedPlans.value = { ...learnedPlans.value, [jobKey]: [] }
}

const unifiedPriceMap = computed(() => jsonStore.getPriceMapWithPersonal(appStore.config.server))
const planRecipeIdSet = computed(() => new Set(Object.keys(jsonStore.planCraftMap || {}).map(id => Number(id))))

const craftJobCards = computed(() => {
  if (!jsonStore.loaded || !Array.isArray(jsonStore.rawCrafts)) return []

  const minItemProfit = appStore.config.minItemProfit || 0
  const minInstanceTotal = appStore.config.minInstanceTotal || 0
  const activeLevelRanges = appStore.config.levelRanges || []

  if (activeLevelRanges.length === 0) return []

  return craftJobsDefinitions.value.map(def => {
    const level = getCraftLevel(def.skillId)
    const learnedPlanSet = learnedPlanSetsByJob.value.get(def.skillId) || new Set()

    // For crafts, calculate kamas per SINGLE craft (no time multiplication)
    const crafts = jsonStore.rawCrafts
      .filter(craft => Number(craft.jobId) === def.skillId && Number(craft.levelRequired || 0) <= level)
      .filter(craft => {
        const recipeId = Number(craft.recipeId)
        const isPlanRecipe = planRecipeIdSet.value.has(recipeId)
        return !isPlanRecipe || learnedPlanSet.has(recipeId)
      })

    const { primaryPick, picks: displayedPicks, totalKamas } = selectCraftPicks(
      crafts,
      unifiedPriceMap.value,
      minItemProfit,
      jsonStore.itemRarityMap
    )

    return {
      skillId: def.skillId,
      label: def.label,
      level,
      totalKamas,
      kamasPerHour: 0,
      usedSeconds: 0,
      unusedSeconds: 0,
      picks: displayedPicks,
      primaryPickLevel: primaryPick?.levelRequired ?? 0
    }
  }).filter(card => {
    if (card.totalKamas < minInstanceTotal) return false

    if (activeLevelRanges.length < LEVEL_RANGES.length) {
      const recipeLevel = Number(card.primaryPickLevel) || 0
      const inRange = activeLevelRanges.some(rangeIndex => {
        const range = LEVEL_RANGES[rangeIndex]
        if (!range) return false
        return recipeLevel >= range.min && recipeLevel <= range.max
      })
      if (!inRange) return false
    }

    return true
  }).sort((a, b) => b.totalKamas - a.totalKamas)
})

const craftPlanListsByJob = computed(() => {
  if (!Array.isArray(jsonStore.rawCrafts)) return new Map()

  const map = new Map()
  jsonStore.rawCrafts
    .filter(craft => {
      return planRecipeIdSet.value.has(Number(craft.recipeId))
    })
    .forEach(craft => {
      const jobId = Number(craft.jobId)
      if (!Number.isFinite(jobId)) return
      if (!map.has(jobId)) map.set(jobId, [])
      map.get(jobId).push(craft)
    })
  map.forEach((list, jobId) => {
    list.sort((a, b) => Number(a.levelRequired || 0) - Number(b.levelRequired || 0))
  })
  return map
})

const craftPlanRowsByJob = computed(() => {
  const map = new Map()
  craftPlanListsByJob.value.forEach((plans, jobId) => {
    const level = getCraftLevel(jobId)
    map.set(
      jobId,
      plans.filter(plan => Number(plan.levelRequired || 0) <= level)
    )
  })
  return map
})

const allCraftCardsExpanded = computed(() => {
  if (craftJobCards.value.length === 0) return false
  return craftJobCards.value.every(card => expandedCraftJobs.value.includes(card.skillId))
})

function toggleAllCraftCards() {
  if (allCraftCardsExpanded.value) {
    expandedCraftJobs.value = []
  } else {
    expandedCraftJobs.value = craftJobCards.value.map(card => card.skillId)
  }
}
</script>
