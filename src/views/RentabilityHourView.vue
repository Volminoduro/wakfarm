<template>
  <div>
    <!-- Sub Navigation + Tab Headers (sticky under main header) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav class="flex items-center border-b cf-bg-secondary cf-border-primary">
        <button
          @click="subTab = 'time'"
          :class="['cf-tab', subTab === 'time' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'time' ? 'text-shadow: var(--active-tab-text-shadow);' : ''"
        >
          <span>Kamas /</span>
          <input
            type="number"
            v-model.number="timePeriod"
            @click.stop
            @input="validateTimePeriod"
            class="cf-input text-sm py-0 px-2 text-center w-16 h-6"
            min="0"
            max="999"
            placeholder="60"
          >
          <span>mins</span>
        </button>

        <button
          @click="subTab = 'config'"
          :class="['cf-tab', subTab === 'config' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'config' ? 'text-shadow: var(--active-tab-text-shadow);' : ''"
        >
          {{ $t('divers.runs_config') || 'Configuration' }}
        </button>

        <button
          @click="subTab = 'harvest'"
          :class="['cf-tab', subTab === 'harvest' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'harvest' ? 'text-shadow: var(--active-tab-text-shadow);' : ''"
        >
          {{ $t('divers.harvest_jobs_tab') || 'Métiers de récolte' }}
        </button>
      </nav>

      <!-- Header for Configuration Tab -->
      <div v-if="subTab === 'config'" class="cf-section-header">
        <ToggleAllButton
          :isExpanded="allExpanded"
          @toggle="toggleAll"
        />

        <button @click="importRuns" class="cf-action-btn cf-action-btn--success" :title="$t('divers.runs_import') || 'Importer depuis le presse-papier'">📥 {{ $t('divers.runs_import') || 'Importer' }}</button>

        <button v-if="hasAnyRuns" @click="exportRuns" class="cf-action-btn cf-action-btn--info" :title="$t('divers.runs_export') || 'Copier la configuration dans le presse-papier'">📋 {{ $t('divers.runs_export') || 'Exporter' }}</button>

        <button v-if="hasAnyRuns" @click="removeAllRuns" class="cf-action-btn cf-action-btn--danger" :title="$t('divers.runs_remove_all') || 'Supprimer tous les runs'">✕ {{ $t('divers.runs_remove_all') || 'Supprimer tous les runs' }}</button>

        <div class="flex-1 text-right">
          <span class="text-sm cf-text-secondary">
            {{ sortedInstances.length }} {{ $t('divers.runs_instances') || 'instances disponibles' }}
          </span>
        </div>
      </div>

      <!-- Header for Kamas / Time Tab -->
      <div v-if="subTab === 'time'" class="cf-section-header">
        <ToggleAllButton
          :isExpanded="allCardsExpanded"
          @toggle="toggleAllCards"
        />
      </div>
    </div>

    <!-- Kamas / Time Tab -->
    <div v-if="subTab === 'time'" class="cf-page">
      <!-- Combined cards list (harvest jobs and instances) -->
      <div v-if="!jsonStore.loaded" class="text-center">
      </div>
      <div v-else-if="allSortedCards.length === 0" class="cf-empty-state">
        <p
          v-if="!hasAnyRuns"
          class="cf-text-secondary cursor-pointer hover:underline"
          @click="subTab = 'config'"
        >
          {{ $t('divers.kamas_hour_no_runs') || 'Aucun run configuré. Allez dans l\'onglet "Configuration" pour en créer.' }}
        </p>

        <p
          v-else
          class="cf-text-secondary"
        >
          {{ $t('divers.kamas_hour_no_runs_matching_filters') || 'Aucun run configuré ne correspond aux filtres actuels. Vérifiez vos filtres ou rendez-vous dans l\'onglet "Configuration".' }}
        </p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <template v-for="card in allSortedCards" :key="card.type === 'harvest' ? 'harvest-' + card.skillId : 'instance-' + card.key">
          <HarvestJobCard
            v-if="card.type === 'harvest'"
            :skill-id="card.skillId"
            :job-label="card.label"
            :job-level="card.level"
            :total-kamas="card.totalKamas"
            :kamas-per-hour="card.kamasPerHour"
            :used-seconds="card.usedSeconds"
            :unused-seconds="card.unusedSeconds"
            :picks="card.picks"
          />
          <InstanceCard
            v-else
            :instance="card.instance"
            :config="card.config"
          />
        </template>
      </div>
    </div>

    <!-- Harvest jobs configuration tab -->
    <div v-else-if="subTab === 'harvest'" class="px-8 py-6 max-w-240 mx-auto">
      <div class="border rounded-lg p-4 mb-4 cf-bg-secondary cf-border-primary">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-2 cf-text-primary">{{ $t('divers.harvest_global_bonus') || 'Bonus de récolte global' }}</label>
            <InputUnitNumber
              :value="harvestGlobalBonus"
              unit="%"
              :min="0"
              :max="999"
              width-class="w-24"
              @input="validateHarvestGlobalBonus"
            />
          </div>
        </div>

      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="job in harvestJobsDefinitions"
          :key="job.skillId"
          class="border rounded-lg p-4 cf-bg-secondary cf-border-primary"
        >
          <h3 class="font-semibold mb-3 cf-text-primary flex items-center gap-2">
            <JobIcon :job-id="job.skillId" />
            <span>{{ job.label }}</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium mb-1 cf-text-secondary">{{ $t('divers.harvest_job_level') || 'Niveau métier' }}</label>
              <input
                type="number"
                :value="harvestJobsConfig[job.skillId]?.level ?? 0"
                @input="(event) => validateHarvestLevel(job.skillId, event)"
                class="cf-input w-24 text-center"
                min="0"
                max="245"
              >
            </div>

            <div>
              <label class="block text-xs font-medium mb-1 cf-text-secondary">{{ $t('divers.harvest_job_bonus') || 'Bonus récolte' }}</label>
              <InputUnitNumber
                :value="harvestJobsConfig[job.skillId]?.bonus"
                unit="%"
                :min="0"
                :max="999"
                width-class="w-18"
                @input="(event) => validateHarvestBonus(job.skillId, event)"
              />
              
            </div>

            <div>
              <label class="block text-xs font-medium mb-1 cf-text-secondary">{{ $t('divers.harvest_job_action_seconds') || 'Temps d\'action / clic' }}</label>
              <InputUnitNumber
                :value="harvestJobsConfig[job.skillId]?.actionSeconds"
                unit="s"
                :min="ACTION_SECONDS_MIN"
                :max="ACTION_SECONDS_MAX"
                step="0.1"
                width-class="w-18"
                :placeholder="String(HARVEST_DEFAULT_ACTION_SECONDS[job.skillId])"
                @input="(event) => validateHarvestActionSeconds(job.skillId, event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Runs configuration tab -->
    <div v-else class="px-8 py-6 max-w-480 mx-auto">
      <div v-if="!jsonStore.loaded" class="text-center py-8">
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <RunConfigCard
          v-for="inst in sortedInstances"
          :key="inst.id"
          :instance="inst"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useConfigRunStore } from '@/stores/useConfigRunStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useChunkedBuilder } from '@/composables/useChunkedBuilder'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { LEVEL_RANGES } from '@/constants'
import RunConfigCard from '@/components/RunConfig/RunConfigCard.vue'
import InstanceCard from '@/components/Instance/InstanceCard.vue'
import HarvestJobCard from '@/components/Harvest/HarvestJobCard.vue'
import JobIcon from '@/components/JobIcon.vue'
import InputUnitNumber from '@/components/InputUnitNumber.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'
import { calculateInstanceForRunWithPricesAndPassFilters, clearCalculatedInstanceCache, clearCalculatedInstanceWithPricesCache } from '@/utils/instanceProcessor'
import { clampInteger, calculateResourceExpectedKamas, optimizeHarvestForTime } from '@/utils/harvestProfit'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const appStore = useAppStore()
const jsonStore = useJsonStore()
const configRunStore = useConfigRunStore()

const subTab = useLocalStorage(LS_KEYS.RUNS_SUBTAB, 'time')

const harvestJobsDefinitions = [
  { skillId: 71, label: computed(() => t('divers.harvest_job_skill_71') || 'Forestier') },
  { skillId: 64, label: computed(() => t('divers.harvest_job_skill_64') || 'Paysan') },
  { skillId: 72, label: computed(() => t('divers.harvest_job_skill_72') || 'Herboriste') },
  { skillId: 73, label: computed(() => t('divers.harvest_job_skill_73') || 'Mineur') },
  { skillId: 75, label: computed(() => t('divers.harvest_job_skill_75') || 'Pêcheur') }
]

const HARVEST_DEFAULT_ACTION_SECONDS = {
  64: 2,  // Paysan
  71: 2,  // Forestier
  72: 2,  // Herboriste
  73: 10, // Mineur
  75: 10  // Pêcheur
}

const defaultHarvestJobsConfig = {
  64: { level: 0, bonus: null, actionSeconds: HARVEST_DEFAULT_ACTION_SECONDS[64] },
  71: { level: 0, bonus: null, actionSeconds: HARVEST_DEFAULT_ACTION_SECONDS[71] },
  72: { level: 0, bonus: null, actionSeconds: HARVEST_DEFAULT_ACTION_SECONDS[72] },
  73: { level: 0, bonus: null, actionSeconds: HARVEST_DEFAULT_ACTION_SECONDS[73] },
  75: { level: 0, bonus: null, actionSeconds: HARVEST_DEFAULT_ACTION_SECONDS[75] }
}

const harvestJobsConfig = useLocalStorage(LS_KEYS.HARVEST_JOBS_CONFIG, defaultHarvestJobsConfig, { deep: true })
const harvestGlobalBonus = useLocalStorage(LS_KEYS.HARVEST_GLOBAL_BONUS, null)
const ACTION_SECONDS_MIN = 0.1
const ACTION_SECONDS_MAX = 999

function normalizeHarvestJobEntry(entry) {
  return {
    level: clampInteger(entry?.level, 0, 245, false),
    bonus: clampInteger(entry?.bonus, 0, 999, true),
    actionSeconds: clampDecimal(entry?.actionSeconds, ACTION_SECONDS_MIN, ACTION_SECONDS_MAX, true)
  }
}

function normalizeHarvestConfig() {
  const normalized = { ...defaultHarvestJobsConfig }
  for (const skillId of Object.keys(defaultHarvestJobsConfig)) {
    normalized[skillId] = normalizeHarvestJobEntry(harvestJobsConfig.value?.[skillId])
  }
  harvestJobsConfig.value = normalized
  harvestGlobalBonus.value = clampInteger(harvestGlobalBonus.value, 0, 999, true)
}

normalizeHarvestConfig()

const sortedInstances = computed(() => {
  const instances = jsonStore.rawInstances || []
  return instances
    .filter(inst => inst.isActive !== false)
    .map(inst => ({
      id: inst.id,
      level: inst.level,
      isDungeon: inst.isDungeon || false,
      isUltimate: inst.isUltimate || false,
      bossId: inst.bossId || null
    }))
    .sort((a, b) => a.level - b.level)
})

const instancesWithRuns = computed(() => {
  return sortedInstances.value.filter(inst => {
    const runs = configRunStore.getRunsForInstance(inst.id)
    return runs && runs.length > 0
  })
})

const allExpanded = computed(() => {
  if (instancesWithRuns.value.length === 0) return false
  return instancesWithRuns.value.every(inst => configRunStore.expandedInstances.has(inst.id))
})

const hasAnyRuns = computed(() => {
  return Object.keys(configRunStore.configs).length > 0
})

function toggleAll() {
  if (allExpanded.value) {
    configRunStore.collapseAll()
  } else {
    configRunStore.expandAll(instancesWithRuns.value.map(i => i.id))
  }
}

function removeAllRuns() {
  if (confirm(t('divers.runs_confirm_remove_all') || 'Êtes-vous sûr de vouloir supprimer tous les runs ?')) {
    configRunStore.removeAllRuns()
  }
}

async function exportRuns() {
  const result = await configRunStore.exportRuns()
  alert(result.message)
}

async function importRuns() {
  try {
    const result = await configRunStore.importRuns()
    alert(`Import réussi ! ${result.count} instance(s) importée(s).`)
  } catch (error) {
    alert(error.message)
  }
}

const expandedHourRuns = useLocalStorage(LS_KEYS.EXPANDED_HOUR_RUNS, [])
const expandedHourJobs = useLocalStorage(LS_KEYS.EXPANDED_HOUR_JOBS, [])
const timePeriod = useLocalStorage(LS_KEYS.TIME_PERIOD, 60)

function validateTimePeriod(event) {
  timePeriod.value = clampInteger(event.target.value, 0, 999, true)
}

function ensureJobConfig(skillId) {
  const existing = harvestJobsConfig.value?.[skillId]
  if (!existing) {
    harvestJobsConfig.value[skillId] = { level: 0, bonus: null, actionSeconds: null }
  }
}

function getInputValue(eventOrValue) {
  if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
    return eventOrValue.target?.value
  }
  return eventOrValue
}

function updateHarvestJobField(skillId, field, eventOrValue, parser) {
  ensureJobConfig(skillId)
  harvestJobsConfig.value[skillId][field] = parser(getInputValue(eventOrValue))
}

function updateHarvestGlobalField(targetRef, eventOrValue, parser) {
  targetRef.value = parser(getInputValue(eventOrValue))
}

function validateHarvestLevel(skillId, event) {
  updateHarvestJobField(skillId, 'level', event, value => clampInteger(value, 0, 245, false))
}

function validateHarvestBonus(skillId, event) {
  updateHarvestJobField(skillId, 'bonus', event, value => clampInteger(value, 0, 999, true))
}

function validateHarvestActionSeconds(skillId, event) {
  updateHarvestJobField(skillId, 'actionSeconds', event, value => clampDecimal(value, ACTION_SECONDS_MIN, ACTION_SECONDS_MAX, true))
}

function validateHarvestGlobalBonus(event) {
  updateHarvestGlobalField(harvestGlobalBonus, event, value => clampInteger(value, 0, 999, true))
}

function clampDecimal(value, min = ACTION_SECONDS_MIN, max = ACTION_SECONDS_MAX, allowNull = true) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return allowNull ? null : min
  }

  const parsed = Number.parseFloat(String(value).replace(',', '.'))
  if (Number.isNaN(parsed)) {
    return allowNull ? null : min
  }

  return Math.min(max, Math.max(min, parsed))
}

const timePeriodMinutes = computed(() => {
  const parsed = Number(timePeriod.value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.floor(parsed)
})

const unifiedPriceMap = computed(() => jsonStore.getPriceMapWithPersonal(appStore.config.server))

const harvestJobCards = computed(() => {
  if (!jsonStore.loaded || !Array.isArray(jsonStore.rawHarvestResources)) return []

  const totalSeconds = timePeriodMinutes.value * 60
  const globalBonus = Math.max(0, Number(harvestGlobalBonus.value) || 0)
  const minItemProfit = appStore.config.minItemProfit || 0
  const minInstanceTotal = appStore.config.minInstanceTotal || 0
  const activeLevelRanges = appStore.config.levelRanges || []

  // If no level ranges are active, return empty array
  if (activeLevelRanges.length === 0) return []

  return harvestJobsDefinitions.map(def => {
    const label = def.label.value
    const config = normalizeHarvestJobEntry(harvestJobsConfig.value?.[def.skillId])
    const totalBonus = globalBonus + (Number(config.bonus) || 0)
    const defaultActionSeconds = HARVEST_DEFAULT_ACTION_SECONDS[def.skillId]
    const effectiveActionSeconds = Number(config.actionSeconds ?? defaultActionSeconds)

    const resources = jsonStore.rawHarvestResources
      .filter(resource => Number(resource.jobSkillId) === def.skillId && Number(resource.skillLevelRequired) <= config.level)
      .map(resource => ({
        ...resource,
        actionSeconds: Math.max(ACTION_SECONDS_MIN, Number.isFinite(effectiveActionSeconds) ? effectiveActionSeconds : defaultActionSeconds),
        quantityMultiplier: 1 + (Math.max(0, Number(totalBonus) || 0) / 100),
        expectedKamas: calculateResourceExpectedKamas(resource, unifiedPriceMap.value, totalBonus)
      }))
      .filter(resource => Number(resource.expectedKamas) > 0)

    const optimized = optimizeHarvestForTime(resources, totalSeconds)
    const kamasPerHour = totalSeconds > 0
      ? (optimized.totalKamas * 3600 / totalSeconds)
      : 0

    // Filter picks by minimum profit and enrich with rarity
    const enrichedPicks = (optimized.picks || [])
      .filter(pick => pick.totalKamas >= minItemProfit)
      .map(pick => {
        const rarity = jsonStore.itemRarityMap[pick.itemId] ?? 0
        return {
          ...pick,
          rarity
        }
      })

    // Recalculate totalKamas after filtering picks
    const filteredTotalKamas = enrichedPicks.reduce((sum, pick) => sum + (pick.totalKamas || 0), 0)

    return {
      skillId: def.skillId,
      label,
      level: config.level,
      totalKamas: filteredTotalKamas,
      kamasPerHour: totalSeconds > 0 ? (filteredTotalKamas * 3600 / totalSeconds) : 0,
      usedSeconds: optimized.usedSeconds,
      unusedSeconds: optimized.unusedSeconds,
      picks: enrichedPicks
    }
  }).filter(card => {
    // Filter by minimum total kamas
    if (card.totalKamas < minInstanceTotal) return false

    // Filter by level ranges (using job level)
    if (activeLevelRanges.length < LEVEL_RANGES.length) {
      const level = card.level || 0
      const inRange = activeLevelRanges.some(rangeIndex => {
        const range = LEVEL_RANGES[rangeIndex]
        if (!range) return false
        return level >= range.min && level <= range.max
      })
      if (!inRange) return false
    }

    return true
  })
})

const { results: sortedHourRuns, rebuild: rebuildSortedHourRunsChunked } = useChunkedBuilder({
  getBase: () => Object.entries(configRunStore.configs),
  buildItem: ([instanceId, runs]) => {
    if (!jsonStore.loaded) return []
    const unifiedPriceMapLocal = jsonStore.getPriceMapWithPersonal(appStore.config.server)
    const timePeriodValue = Number.isFinite(timePeriod.value) ? timePeriod.value : null
    return runs.map(config => {
      const configWithServer = { ...config, server: appStore.config.server, timePeriod: timePeriodValue }
      const instanceData = calculateInstanceForRunWithPricesAndPassFilters(parseInt(instanceId, 10), configWithServer, unifiedPriceMapLocal)
      if (!instanceData || configWithServer.time <= 0) return null
      return {
        key: `${instanceId}_${config.id}`,
        instance: instanceData,
        config: configWithServer
      }
    })
  },
  sortFn: (a, b) => b.instance.totalKamas - a.instance.totalKamas,
  chunkSize: 40
})

watch(
  () => [
    jsonStore.loaded,
    jsonStore.pricesLastUpdate,
    appStore.config,
    configRunStore.configs
  ],
  () => {
    rebuildSortedHourRunsChunked()
  },
  { deep: true, immediate: true }
)

watch(
  () => appStore.config.server,
  () => {
    clearCalculatedInstanceCache()
    clearCalculatedInstanceWithPricesCache()
  }
)

watch(
  () => jsonStore.pricesLastUpdate,
  () => {
    clearCalculatedInstanceWithPricesCache()
  }
)

// Combine harvest jobs and instance runs sorted by total kamas
const allSortedCards = computed(() => {
  const harvestCards = harvestJobCards.value.map(card => ({
    ...card,
    type: 'harvest',
    sortKey: card.totalKamas
  }))
  
  const instanceCards = sortedHourRuns.value.map(runData => ({
    ...runData,
    type: 'instance',
    sortKey: runData.instance?.totalKamas || 0
  }))
  
  return [...harvestCards, ...instanceCards].sort((a, b) => b.sortKey - a.sortKey)
})

const allCardsExpanded = computed(() => {
  if (allSortedCards.value.length === 0) return false

  const allHarvestExpanded = harvestJobCards.value.every(card =>
    expandedHourJobs.value.includes(card.skillId)
  )
  const allInstancesExpanded = sortedHourRuns.value.every(run =>
    expandedHourRuns.value.includes(run.key)
  )

  return allHarvestExpanded && allInstancesExpanded
})

function toggleAllCards() {
  if (allCardsExpanded.value) {
    // Collapse all
    expandedHourJobs.value = []
    expandedHourRuns.value = []
  } else {
    // Expand all
    expandedHourJobs.value = harvestJobCards.value.map(card => card.skillId)
    expandedHourRuns.value = sortedHourRuns.value.map(r => r.key)
  }
}
</script>

<style scoped>
input[type=number] {
  appearance: textfield;
}
</style>
