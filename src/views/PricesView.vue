<template>
  <div>
    <!-- Tabs (sticky under main header) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav class="flex items-center border-b cf-bg-secondary cf-border-primary">
        <button
          @click="activeTab = 'collective'"
          :class="['cf-tab', activeTab === 'collective' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="activeTab === 'collective' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.prices_tab_collective') }}
        </button>
        <button
          @click="activeTab = 'personal'"
          :class="['cf-tab', activeTab === 'personal' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="activeTab === 'personal' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.prices_tab_personal') }}
        </button>
      </nav>
    </div>

    <div v-if="!isTabContentReady" class="px-8 py-6 max-w-480 mx-auto">
      <div class="cf-empty-state">
        <p class="cf-text-secondary">{{ $t('divers.prices_loading_data') || 'Chargement des données...' }}</p>
      </div>
    </div>

    <div v-else class="px-8 py-6 max-w-480 mx-auto">
      <PricesTabPanel
        :key="activeTab"
        :tab-type="activeTab"
        :all-items="currentItems"
        :sources="allSourcesList"
        @update-price="onUpdatePrice"
        @clear-all="onClearAll"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useJsonStore } from '@/stores/useJsonStore'
import { useCollectivePricesStore } from '@/stores/useCollectivePricesStore'  // Firebase
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useAppStore } from '@/stores/useAppStore'
import { useI18n } from 'vue-i18n'
import PricesTabPanel from '@/components/PricesTabPanel.vue'
import { buildItemJobSkillIdsMap, getAllJobSkillIds } from '@/utils/craftProfit'

const { t, locale } = useI18n()

const jsonStore = useJsonStore()
const collectivePricesStore = useCollectivePricesStore()  // Firebase
const personalPricesStore = usePersonalPricesStore()
const appStore = useAppStore()

// Cache des traductions (items, instances) — clé préfixée par la locale pour ne pas
// servir des noms périmés après un changement de langue.
const translationCache = new Map()

function cachedT(prefix, id, fallback) {
  const key = `${locale.value}:${prefix}${id}`
  if (!translationCache.has(key)) {
    translationCache.set(key, t(prefix + id) || fallback)
  }
  return translationCache.get(key)
}

function getCachedItemName(itemId) {
  return cachedT('items.', itemId, `Item #${itemId}`)
}

function getCachedInstanceName(instanceId) {
  return cachedT('instances.', instanceId)
}

function getHarvestJobName(skillId) {
  const key = `divers.harvest_job_skill_${skillId}`
  const translated = t(key)
  if (translated && translated !== key) return translated
  return `${t('divers.harvest_jobs_tab') || 'Métier'} #${skillId}`
}

// Active tab state
const activeTab = useLocalStorage(LS_KEYS.PRICES_ACTIVE_TAB, 'collective')
const isTabContentReady = ref(false)

function deferTabContentRender() {
  isTabContentReady.value = false

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        isTabContentReady.value = true
      })
    })
    return
  }

  setTimeout(() => {
    isTabContentReady.value = true
  }, 0)
}

watch(activeTab, () => {
  deferTabContentRender()
}, { immediate: true })

// ========================================
// SOURCES (instances + métiers) — partagées par les deux onglets
// ========================================

const allInstancesList = computed(() => {
  const instances = jsonStore.rawInstances || []
  return instances
    .filter(inst => inst.isActive !== false)
    .map(inst => ({
      id: inst.id,
      sourceId: `instance:${inst.id}`,
      type: 'instance',
      name: getCachedInstanceName(inst.id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const allHarvestJobsList = computed(() => {
  const harvest = Array.isArray(jsonStore.rawHarvestResources) ? jsonStore.rawHarvestResources : []
  const crafts = Array.isArray(jsonStore.rawCrafts) ? jsonStore.rawCrafts : []
  const uniqueSkillIds = getAllJobSkillIds(harvest, crafts)

  return uniqueSkillIds
    .map(skillId => ({
      id: skillId,
      sourceId: `job:${skillId}`,
      type: 'job',
      name: getHarvestJobName(skillId)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const allSourcesList = computed(() => {
  const instances = allInstancesList.value
  const jobs = allHarvestJobsList.value
  return {
    instances,
    jobs,
    flat: [...jobs, ...instances]
  }
})

// Normalisation des filtres de sources stockés (anciens formats : ids numériques nus).
// useLocalStorage met en cache les refs par clé : ce sont les MÊMES refs que celles
// utilisées par PricesTabPanel.
const filterSourcesPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_INSTANCES, [], { deep: true })
const filterSourcesCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_INSTANCES, [], { deep: true })

function normalizeStoredSourceIds(storedIds, availableSources) {
  const sourceIdSet = new Set((availableSources || []).map(source => source.sourceId))
  const normalized = (storedIds || []).map((id) => {
    if (typeof id === 'number') return `instance:${id}`
    if (typeof id === 'string') {
      if (sourceIdSet.has(id)) return id
      if (/^\d+$/.test(id)) return `instance:${id}`
      if (/^(instance|job):\d+$/.test(id)) return id
    }
    return null
  }).filter(Boolean)

  return [...new Set(normalized)]
}

function hasStoredFilter(key) {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(key) !== null
}

function setupSourcesNormalization(filterRef, storageKey) {
  watch(allSourcesList, (newSources) => {
    if (newSources.flat.length === 0) return
    if (!hasStoredFilter(storageKey) && filterRef.value.length === 0) {
      filterRef.value = newSources.flat.map(source => source.sourceId)
      return
    }
    filterRef.value = normalizeStoredSourceIds(filterRef.value, newSources.flat)
  }, { immediate: true })
}

setupSourcesNormalization(filterSourcesPersonal, LS_KEYS.PRICES_PERSONAL_INSTANCES)
setupSourcesNormalization(filterSourcesCollective, LS_KEYS.PRICES_COLLECTIVE_INSTANCES)

// ========================================
// ITEMS
// ========================================

// Métadonnées statiques des items (niveau, rareté, sources, noms) — INDÉPENDANTES des prix.
// Calculées une seule fois et mémoïsées : ne se recalculent QUE si les données du jeu
// changent, pas à chaque mise à jour de prix. Évite de rejouer buildItemJobSkillIdsMap
// et la construction des noms de sources à chaque saisie de prix.
const itemsBase = computed(() => {
  const items = jsonStore.rawItems || []
  const itemInstances = jsonStore.itemToInstancesMap
  const harvestResources = Array.isArray(jsonStore.rawHarvestResources) ? jsonStore.rawHarvestResources : []
  const crafts = Array.isArray(jsonStore.rawCrafts) ? jsonStore.rawCrafts : []
  const itemJobSkillIdsMap = buildItemJobSkillIdsMap(harvestResources, crafts)

  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))

    const jobSkillIds = [...(itemJobSkillIdsMap.get(item.id) || new Set())].sort((a, b) => a - b)
    const jobNames = jobSkillIds
      .map(skillId => getHarvestJobName(skillId))
      .sort((a, b) => a.localeCompare(b))

    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      sourceIds: [
        ...instanceIds.map(id => `instance:${id}`),
        ...jobSkillIds.map(skillId => `job:${skillId}`)
      ],
      sources: [...instanceNames, ...jobNames]
    }
  })
})

// Superpose les prix d'un store sur la base statique (opération légère, rejouée à chaque maj de prix).
function withPrices(priceMap) {
  return itemsBase.value.map(item => ({ ...item, price: priceMap[item.id]?.price ?? null }))
}

const allItemsPersonal = computed(() => {
  appStore.config  // dépendance réactive sur le changement de serveur
  const priceMap = personalPricesStore.prices[appStore.config.server] || {}
  return withPrices(priceMap)
})

const allItemsCollective = computed(() => {
  appStore.config  // dépendance réactive sur le changement de serveur
  const priceMap = collectivePricesStore.prices[appStore.config.server] || {}
  return withPrices(priceMap)
})

const currentItems = computed(() =>
  activeTab.value === 'personal' ? allItemsPersonal.value : allItemsCollective.value
)

// ========================================
// HANDLERS
// ========================================

// Price update handler (unified for both tabs)
function onUpdatePrice({ itemId, newPrice, tabType }) {
  const server = appStore.config.server

  if (tabType === 'personal') {
    personalPricesStore.updatePrice(server, itemId, newPrice)
  } else {
    collectivePricesStore.updatePrice(server, itemId, newPrice)
  }
}

function onClearAll() {
  if (activeTab.value === 'personal') {
    if (confirm(t('divers.prices_clear_personal_confirm') || 'Are you sure?')) {
      personalPricesStore.clearAll()
    }
  } else {
    if (confirm(t('divers.confirm_clear_all_prices') || 'Are you sure?')) {
      collectivePricesStore.clearAllPrices()
    }
  }
}
</script>
