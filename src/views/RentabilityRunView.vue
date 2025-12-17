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
    <div class="px-8 py-6 max-w-480 mx-auto">
      <div v-if="!jsonStore.loaded" class="text-center">
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <InstanceCard
          v-for="inst in sortedInstances"
          :key="inst.key"
          :instance="inst"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import InstanceCard from '@/components/Instance/InstanceCard.vue'
import ToggleAllButton from '@/components/ToggleAllButton.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { calculateInstanceForRunWithPricesAndPassFilters } from '@/utils/instanceProcessor'


const appStore = useAppStore()
const jsonStore = useJsonStore()

// Gestion de l'expansion pour Kamas/Run (persistée en localStorage)
const expandedRun = useLocalStorage(LS_KEYS.EXPANDED_RUN, [])

// Expanded run keys are persisted in `expandedRun` (localStorage)

// Calculer et trier les instances dynamiquement (sur demande via instancesBase)
const sortedInstances = computed(() => {
  if (!jsonStore.loaded) return []

  const enriched = jsonStore.instancesBase.map(inst => {
    const result = calculateInstanceForRunWithPricesAndPassFilters(inst.id, appStore.config, jsonStore.priceMap)
    return result
  }).filter(inst => inst && inst.isDungeon)

  return (enriched || [])
    .map(inst => ({
      ...inst,
      key: `global_${inst.id}`
    }))
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
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