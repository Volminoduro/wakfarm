<template>
  <div>
    
    <!-- Toggle All Button and Config Row (sticky under app header using Tailwind sticky) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <div class="px-4 py-2 border-b cf-bg-secondary cf-border-primary">
        <div class="flex items-center justify-between gap-4">
          <ToggleAllButton
            :isExpanded="allRunExpanded"
            @toggle="toggleAllRun"
          />

          <!-- Config row: Modulé, Booster, Stasis, Stèles, Stèles Interv. -->
          <div class="flex items-center gap-6">
            <div class="flex flex-col items-center gap-1">
              <label class="text-xs font-medium cf-text-secondary">{{ $t('divers.config_modulated') }}</label>
              <input 
                type="checkbox" 
                v-model="appStore.config.isModulated"
                class="custom-checkbox"
              />
            </div>

            <div class="flex flex-col items-center gap-1">
              <label class="text-xs font-medium cf-text-secondary">{{ $t('divers.config_booster') }}</label>
              <input 
                type="checkbox" 
                v-model="appStore.config.isBooster"
                class="custom-checkbox"
              />
            </div>

            <div class="flex flex-col items-center gap-1">
              <label class="text-xs font-medium cf-text-secondary">{{ $t('divers.config_stasis') }}</label>
              <select 
                  v-model.number="appStore.config.stasis"
                  class="cf-select w-16.25"
                >
                <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>

            <div class="flex flex-col items-center gap-1">
              <label class="text-xs font-medium cf-text-secondary">{{ $t('divers.config_steles') }}</label>
              <select 
                v-model.number="appStore.config.steles"
                class="cf-select w-16.25"
              >
                <option v-for="n in 5" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>

            <div class="flex flex-col items-center gap-1">
              <label class="text-xs font-medium cf-text-secondary">{{ $t('divers.config_stele_intervention') }}</label>
              <select 
                v-model.number="appStore.config.steleIntervention"
                class="cf-select w-16.25"
              >
                <option v-for="n in 4" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
             <!-- Stèle Archi -->
             <div class="flex flex-col items-center gap-1">
               <label class="text-xs font-medium cf-text-secondary">{{ $t('divers.config_stele_archi') }}</label>
               <input
                 type="checkbox"
                 v-model="appStore.config.isSteleArchi"
                 class="custom-checkbox"
               />
             </div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="px-4 py-2 border-b cf-bg-secondary cf-border-primary">
        <p class="text-sm italic cf-text-secondary">{{ $t('divers.disclaimer_rifts_excluded') }}</p>
      </div>
    </div>
    
    <!-- Kamas / Run -->
    <div class="px-8 py-6 max-w-480 mx-auto" ref="scrollContainer">
      <div v-if="!jsonStore.loaded" class="text-center">
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <InstanceCard
          v-for="inst in visibleInstances"
          :key="inst.key"
          :instance="inst"
        />
      </div>
      <!-- Loading indicator -->
      <div v-if="hasMore && jsonStore.loaded" class="text-center py-4">
        <span class="text-slate-400 text-sm">{{ $t('divers.loading') || 'Chargement...' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useCollectivePricesStore } from '@/stores/useCollectivePricesStore'
import InstanceCard from '@/components/Instance/InstanceCard.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { calculateInstanceForRunWithPricesAndPassFilters } from '@/utils/instanceProcessor'


const appStore = useAppStore()
const jsonStore = useJsonStore()
const personalPricesStore = usePersonalPricesStore()
const collectivePricesStore = useCollectivePricesStore()

// Gestion de l'expansion pour Kamas/Run (persistée en localStorage)
const expandedRun = useLocalStorage(LS_KEYS.EXPANDED_RUN, [])

// Infinite scroll state
const visibleCount = ref(20)
const ITEMS_PER_PAGE = 20
const scrollContainer = ref(null)

// Expanded run keys are persisted in `expandedRun` (localStorage)

const sortedInstances = ref([])
let buildToken = 0
const CHUNK_SIZE = 40

async function rebuildSortedInstancesChunked() {
  const token = ++buildToken
  if (!jsonStore.loaded) {
    sortedInstances.value = []
    return
  }


  // Créer une dépendance réactive aux prix personnels et collectifs et au serveur
  personalPricesStore.prices
  collectivePricesStore.prices
  appStore.config  // Trigger recalculation on any config change (including server)
  jsonStore.pricesLastUpdate

  const unifiedPriceMap = jsonStore.getPriceMapWithPersonal(appStore.config.server)
  const base = Array.isArray(jsonStore.instancesBase) ? jsonStore.instancesBase : []
  const results = []

  for (let i = 0; i < base.length; i += CHUNK_SIZE) {
    if (token !== buildToken) return
    const chunk = base.slice(i, i + CHUNK_SIZE)

    chunk.forEach(inst => {
      const result = calculateInstanceForRunWithPricesAndPassFilters(inst.id, appStore.config, unifiedPriceMap)
      if (result && result.isDungeon) {
        results.push({
          ...result,
          key: `global_${result.id}`
        })
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))
  }

  if (token !== buildToken) return

  results.sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
  sortedInstances.value = results
}

// Visible instances for infinite scroll
const visibleInstances = computed(() => {
  return sortedInstances.value.slice(0, visibleCount.value)
})

const hasMore = computed(() => {
  return visibleCount.value < sortedInstances.value.length
})

// Handle scroll for infinite loading
function handleScroll() {
  if (!hasMore.value) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // Load more when user is 500px from bottom
  if (scrollTop + windowHeight >= documentHeight - 500) {
    visibleCount.value = Math.min(
      visibleCount.value + ITEMS_PER_PAGE,
      sortedInstances.value.length
    )
  }
}

// Reset visible count when data changes
watch(() => sortedInstances.value.length, () => {
  visibleCount.value = ITEMS_PER_PAGE
})

// Also reset when config changes (like server, modulated, etc.)
watch(() => appStore.config, () => {
  visibleCount.value = ITEMS_PER_PAGE
}, { deep: true })

watch(
  () => [
    jsonStore.loaded,
    jsonStore.instancesBase,
    jsonStore.pricesLastUpdate,
    appStore.config
  ],
  () => {
    visibleCount.value = ITEMS_PER_PAGE
    rebuildSortedInstancesChunked()
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const allRunExpanded = computed(() => {
  if (sortedInstances.value.length === 0) return false
  return sortedInstances.value.every(inst => expandedRun.value.includes(inst.key))
})

function toggleAllRun() {
  if (allRunExpanded.value) {
    expandedRun.value = []
  } else {
    expandedRun.value = sortedInstances.value.map(inst => inst.key)
  }
}
</script>