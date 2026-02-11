<template>
  <div>
    <!-- Sub Navigation + Tab Headers (sticky under main header) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav class="flex items-center border-b cf-bg-secondary cf-border-primary">
        <button 
          @click="subTab = 'time'" 
          :class="['cf-tab', subTab === 'time' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'time' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          <span>Kamas /</span>
          <input 
            type="number"
            v-model.number="timePeriod"
            @click.stop
            @input="validateTimePeriod"
            class="cf-input text-sm py-0 px-2 text-center w-16 h-6"
            min="1"
            max="999"
            placeholder="60"
          />
          <span>mins</span>
        </button>
        <button 
          @click="subTab = 'config' " 
          :class="['cf-tab', subTab === 'config' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="subTab === 'config' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.runs_config') || 'Configuration' }}
        </button>
      </nav>

      <!-- Header for Configuration Tab -->
      <div v-if="subTab === 'config'" class="cf-section-header">
        <!-- Toggle all button -->
        <ToggleAllButton
          :isExpanded="allExpanded"
          @toggle="toggleAll"
        />

        <!-- Import button -->
        <button @click="importRuns" class="cf-action-btn cf-action-btn--success" :title="$t('divers.runs_import') || 'Importer depuis le presse-papier'">📥 {{ $t('divers.runs_import') || 'Importer' }}</button>

        <!-- Export button -->
        <button v-if="hasAnyRuns" @click="exportRuns" class="cf-action-btn cf-action-btn--info" :title="$t('divers.runs_export') || 'Copier la configuration dans le presse-papier'">📋 {{ $t('divers.runs_export') || 'Exporter' }}</button>

        <!-- Remove all button -->
        <button v-if="hasAnyRuns" @click="removeAllRuns" class="cf-action-btn cf-action-btn--danger" :title="$t('divers.runs_remove_all') || 'Supprimer tous les runs'">✕ {{ $t('divers.runs_remove_all') || 'Supprimer tous les runs' }}</button>

        <!-- Info text -->
          <div class="flex-1 text-right">
          <span class="text-sm cf-text-secondary">
            {{ sortedInstances.length }} {{ $t('divers.runs_instances') || 'instances disponibles' }}
          </span>
        </div>
      </div>

      <!-- Header for Kamas / Time Tab -->
      <div v-if="subTab === 'time'" class="cf-section-header">
        <ToggleAllButton
          :isExpanded="allHourRunsExpanded"
          @toggle="toggleAllHourRuns"
        />
      </div>
    </div>

    <!-- Kamas / Time Tab -->
    <div v-if="subTab === 'time'" class="cf-page">

      <!-- Runs list -->
      <div v-if="!jsonStore.loaded" class="text-center">
      </div>
      <div v-else-if="sortedHourRuns.length === 0" class="cf-empty-state">
        <!-- No runs configured at all -->
        <p 
          v-if="!hasAnyRuns"
          class="cf-text-secondary cursor-pointer hover:underline"
          @click="subTab = 'config'"
        >
          {{ $t('divers.kamas_hour_no_runs') || 'Aucun run configuré. Allez dans l\'onglet "Configuration" pour en créer.' }}
        </p>

        <!-- Runs exist but none pass current filters -->
        <p
          v-else
          class="cf-text-secondary">
          {{ $t('divers.kamas_hour_no_runs_matching_filters') || 'Aucun run configuré ne correspond aux filtres actuels. Vérifiez vos filtres ou rendez-vous dans l\'onglet "Configuration".' }}
        </p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <InstanceCard
          v-for="runData in sortedHourRuns"
          :key="runData.key"
          :instance="runData.instance"
          :config="runData.config"
        />
      </div>
    </div>

    <!-- Configuration Tab -->
    <div v-else class="px-8 py-6 max-w-480 mx-auto">
    <!-- Loading state -->
    <div v-if="!jsonStore.loaded" class="text-center py-8">
    </div>

    <!-- Instances grid -->
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
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useConfigRunStore } from '@/stores/useConfigRunStore'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useCollectivePricesStore } from '@/stores/useCollectivePricesStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
// use CSS variables instead of importing color constants
import RunConfigCard from '@/components/RunConfig/RunConfigCard.vue'
import InstanceCard from '@/components/Instance/InstanceCard.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'
import { calculateInstanceForRunWithPricesAndPassFilters } from '@/utils/instanceProcessor'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const appStore = useAppStore()
const jsonStore = useJsonStore()
const configRunStore = useConfigRunStore()
const personalPricesStore = usePersonalPricesStore()
const collectivePricesStore = useCollectivePricesStore()

// Sub-tab management
const subTab = useLocalStorage(LS_KEYS.RUNS_SUBTAB, 'time')

// Get all instances sorted by level (enriched with name and bossId for UI)
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

// Get instances that have runs
const instancesWithRuns = computed(() => {
  return sortedInstances.value.filter(inst => {
    const runs = configRunStore.getRunsForInstance(inst.id)
    return runs && runs.length > 0
  })
})

// Check if all instances with runs are expanded
const allExpanded = computed(() => {
  if (instancesWithRuns.value.length === 0) return false
  return instancesWithRuns.value.every(inst => configRunStore.expandedInstances.has(inst.id))
})

// Check if there are any runs
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

// Kamas/Time logic
// Persist expanded hour runs as an array in localStorage; cards manage their own expansion.
const expandedHourRuns = useLocalStorage(LS_KEYS.EXPANDED_HOUR_RUNS, [])
const timePeriod = useLocalStorage(LS_KEYS.TIME_PERIOD, 60)

// Validate time period input
function validateTimePeriod(event) {
  const value = event.target.value
  // When input is cleared, reset to default 60 (so cards update predictably)
  if (value === '' || value === null) {
    timePeriod.value = 60
  }
  timePeriod.value = Math.max(1, Math.min(999, parseInt(value) || 60))
}


// Build all runs with their kamas/period calculation
const sortedHourRuns = ref([])
let buildToken = 0
const CHUNK_SIZE = 40

async function rebuildSortedHourRunsChunked() {
  const token = ++buildToken
  if (!jsonStore.loaded) {
    sortedHourRuns.value = []
    return
  }

  // Créer une dépendance réactive aux prix personnels et collectifs et au serveur
  personalPricesStore.prices
  collectivePricesStore.prices
  appStore.config  // Trigger recalculation on any config change (including server)
  jsonStore.pricesLastUpdate

  const unifiedPriceMap = jsonStore.getPriceMapWithPersonal(appStore.config.server)
  const entries = Object.entries(configRunStore.configs)
  const results = []

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    if (token !== buildToken) return
    const chunk = entries.slice(i, i + CHUNK_SIZE)

    chunk.forEach(([instanceId, runs]) => {
      runs.forEach(config => {
        const instanceData = calculateInstanceForRunWithPricesAndPassFilters(parseInt(instanceId), config, unifiedPriceMap)
        if (instanceData && config.time > 0) {
          results.push({
            key: `${instanceId}_${config.id}`,
            instance: instanceData,
            config: config
          })
        }
      })
    })

    await new Promise(resolve => setTimeout(resolve, 0))
  }

  if (token !== buildToken) return

  results.sort((a, b) => b.instance.totalKamas - a.instance.totalKamas)
  sortedHourRuns.value = results
}

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

const allHourRunsExpanded = computed(() => {
  if (sortedHourRuns.value.length === 0) return false
  return sortedHourRuns.value.every(r => expandedHourRuns.value.includes(r.key))
})

function toggleAllHourRuns() {
  if (allHourRunsExpanded.value) {
    expandedHourRuns.value = []
  } else {
    expandedHourRuns.value = sortedHourRuns.value.map(r => r.key)
  }
}
</script>