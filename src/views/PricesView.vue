<template>
  <div>
    <!-- Tabs (sticky under main header) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav class="flex items-center border-b cf-bg-secondary cf-border-primary">
        <button 
          @click="activeTab = 'personal'" 
          :class="['cf-tab', activeTab === 'personal' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="activeTab === 'personal' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.prices_tab_personal') }}
        </button>
        <button 
          @click="activeTab = 'collective'" 
          :class="['cf-tab', activeTab === 'collective' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="activeTab === 'collective' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.prices_tab_collective') }}
        </button>
      </nav>
    </div>

    <!-- Personal Tab -->
    <div v-if="activeTab === 'personal'" class="px-8 py-6 max-w-480 mx-auto">
      <!-- Filters and Pagination Controls -->
      <div class="bg-secondary border-2 border-wakfu-gray rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Search by name -->
          <div class="relative" ref="searchDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_search_name') }}</label>
            <input
              v-model="searchNamePersonal"
              @input="onSearchInputPersonal"
              @focus="showAutocompletePersonal = true"
              type="text"
              :placeholder="$t('divers.prices_search_placeholder')"
              class="cf-input w-full rounded px-3 py-2"
            />
            
            <div v-if="showAutocompletePersonal && autocompleteItemsPersonal.length > 0" 
              class="cf-dropdown">
              <div class="p-1">
                <button
                  v-for="item in autocompleteItemsPersonal"
                  :key="item.id"
                  @click="selectItemPersonal(item)"
                  class="cf-autocomplete-item">
                  <span :class="['font-bold', getRarityClass(item.rarity)]">
                    {{ item.name }}
                  </span>
                  <span class="text-slate-400 text-sm ml-2">
                    ({{ $t('divers.prices_col_level') }} {{ item.level }})
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Filter by rarity -->
          <div class="relative" ref="rarityDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_rarity') }}</label>
            <button
              @click="isRarityDropdownOpenPersonal = !isRarityDropdownOpenPersonal"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getRarityDisplayTextPersonal() }}</span>
              <span>{{ isRarityDropdownOpenPersonal ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isRarityDropdownOpenPersonal" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <div class="flex gap-2 mb-2 pb-2">
                  <button 
                    @click="toggleAllRaritiesPersonal(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllRaritiesPersonal(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="r in 8" 
                  :key="r-1"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterRaritiesPersonal.includes(r-1)"
                    @change="toggleRarityPersonal(r-1)"
                    class="custom-checkbox-small"
                  />
                  <span :class="getRarityClass(r-1)">
                    {{ getRarityName(r-1) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Filter by level -->
          <div>
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_level') }}</label>
            <div class="flex gap-2">
              <input
                v-model.number="filterLevelMinPersonal"
                @input="validateLevelMinPersonal"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_min')"
                class="cf-input w-full rounded px-3 py-2"
              />
              <input
                v-model.number="filterLevelMaxPersonal"
                @input="validateLevelMaxPersonal"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_max')"
                class="cf-input w-full rounded px-3 py-2"
              />
            </div>
          </div>
          
          <!-- Filter by sources -->
          <div class="relative" ref="instancesDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_sources') || $t('divers.prices_filter_instances') }}</label>
            <button
              @click="isInstancesDropdownOpenPersonal = !isInstancesDropdownOpenPersonal"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getSourcesDisplayTextPersonal() }}</span>
              <span>{{ isInstancesDropdownOpenPersonal ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isInstancesDropdownOpenPersonal" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <input
                  v-model="sourceSearchPersonal"
                  type="text"
                  :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                  class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                  @click.stop
                />
                <div class="flex gap-2 mb-2 pb-2">
                  <button 
                    @click="toggleAllSourcesPersonal(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllSourcesPersonal(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>

                <div class="border-t border-slate-600 my-2"></div>

                <p class="text-xs uppercase tracking-wide cf-text-secondary mt-2 mb-1">{{ $t('divers.prices_sources_group_jobs') || 'Métiers' }}</p>

                <div class="flex gap-2 mb-2">
                  <button 
                    @click="toggleAllJobsSourcesPersonal(true)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllJobsSourcesPersonal(false)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>

                <label 
                  v-for="job in filteredJobSourcesPersonal" 
                  :key="job.sourceId"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterSourcesPersonal.includes(job.sourceId)"
                    @change="toggleSourcePersonal(job.sourceId)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ job.name }}
                  </span>
                </label>

                <p class="text-xs uppercase tracking-wide cf-text-secondary mt-2 mb-1">{{ $t('divers.prices_sources_group_instances') || 'Instances' }}</p>
                
                <div class="flex gap-2 mb-2">
                  <button 
                    @click="toggleAllInstancesSourcesPersonal(true)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllInstancesSourcesPersonal(false)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="inst in filteredInstanceSourcesPersonal" 
                  :key="inst.sourceId"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterSourcesPersonal.includes(inst.sourceId)"
                    @change="toggleSourcePersonal(inst.sourceId)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ inst.name }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Items per page selector -->
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium cf-text-secondary">{{ $t('divers.prices_per_page') }}</label>
          <select
            v-model.number="itemsPerPagePersonal"
            class="cf-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
        </div>
      </div>
      
      <!-- Info banner for personal prices -->
      <div class="bg-blue-900/30 border-2 border-blue-700/50 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm text-blue-200">{{ $t('divers.prices_personal_info') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Personal Prices Table -->
      <PricesTable
        tab-type="personal"
        :all-items="allItemsPersonal"
        :search-name="searchNamePersonal"
        :filter-rarities="filterRaritiesPersonal"
        :filter-level-min="filterLevelMinPersonal"
        :filter-level-max="filterLevelMaxPersonal"
        :filter-sources="filterSourcesPersonal"
        :sort-column="sortColumnPersonal"
        :sort-direction="sortDirectionPersonal"
        :current-page="currentPagePersonal"
        :items-per-page="itemsPerPagePersonal"
        @sort-by="onSortByPersonal"
        @update:current-page="currentPagePersonal = $event"
        @update-price="onUpdatePrice"
        @clear-all="clearAllPersonalPrices"
      />
    </div>

    <!-- Collective Tab -->
    <div v-if="activeTab === 'collective'" class="px-8 py-6 max-w-480 mx-auto">
      <!-- Filters and Pagination Controls -->
      <div class="bg-secondary border-2 border-wakfu-gray rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Search by name -->
          <div class="relative" ref="searchDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_search_name') }}</label>
            <input
              v-model="searchNameCollective"
              @input="onSearchInputCollective"
              @focus="showAutocompleteCollective = true"
              type="text"
              :placeholder="$t('divers.prices_search_placeholder')"
              class="cf-input w-full rounded px-3 py-2"
            />
            
            <div v-if="showAutocompleteCollective && autocompleteItemsCollective.length > 0" 
              class="cf-dropdown">
              <div class="p-1">
                <button
                  v-for="item in autocompleteItemsCollective"
                  :key="item.id"
                  @click="selectItemCollective(item)"
                  class="cf-autocomplete-item">
                  <span :class="['font-bold', getRarityClass(item.rarity)]">
                    {{ item.name }}
                  </span>
                  <span class="text-slate-400 text-sm ml-2">
                    ({{ $t('divers.prices_col_level') }} {{ item.level }})
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Filter by rarity -->
          <div class="relative" ref="rarityDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_rarity') }}</label>
            <button
              @click="isRarityDropdownOpenCollective = !isRarityDropdownOpenCollective"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getRarityDisplayTextCollective() }}</span>
              <span>{{ isRarityDropdownOpenCollective ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isRarityDropdownOpenCollective" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <div class="flex gap-2 mb-2 pb-2">
                  <button 
                    @click="toggleAllRaritiesCollective(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllRaritiesCollective(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="r in 8" 
                  :key="r-1"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterRaritiesCollective.includes(r-1)"
                    @change="toggleRarityCollective(r-1)"
                    class="custom-checkbox-small"
                  />
                  <span :class="getRarityClass(r-1)">
                    {{ getRarityName(r-1) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Filter by level -->
          <div>
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_level') }}</label>
            <div class="flex gap-2">
              <input
                v-model.number="filterLevelMinCollective"
                @input="validateLevelMinCollective"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_min')"
                class="cf-input w-full rounded px-3 py-2"
              />
              <input
                v-model.number="filterLevelMaxCollective"
                @input="validateLevelMaxCollective"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_max')"
                class="cf-input w-full rounded px-3 py-2"
              />
            </div>
          </div>
          
          <!-- Filter by sources -->
          <div class="relative" ref="instancesDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_sources') || $t('divers.prices_filter_instances') }}</label>
            <button
              @click="isInstancesDropdownOpenCollective = !isInstancesDropdownOpenCollective"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getSourcesDisplayTextCollective() }}</span>
              <span>{{ isInstancesDropdownOpenCollective ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isInstancesDropdownOpenCollective" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <input
                  v-model="sourceSearchCollective"
                  type="text"
                  :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                  class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                  @click.stop
                />
                <div class="flex gap-2 mb-2 pb-2">
                  <button 
                    @click="toggleAllSourcesCollective(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllSourcesCollective(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>

                <div class="border-t border-slate-600 my-2"></div>

                <p class="text-xs uppercase tracking-wide cf-text-secondary mt-2 mb-1">{{ $t('divers.prices_sources_group_jobs') || 'Métiers' }}</p>

                <div class="flex gap-2 mb-2">
                  <button 
                    @click="toggleAllJobsSourcesCollective(true)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllJobsSourcesCollective(false)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>

                <label 
                  v-for="job in filteredJobSourcesCollective" 
                  :key="job.sourceId"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterSourcesCollective.includes(job.sourceId)"
                    @change="toggleSourceCollective(job.sourceId)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ job.name }}
                  </span>
                </label>

                <p class="text-xs uppercase tracking-wide cf-text-secondary mt-2 mb-1">{{ $t('divers.prices_sources_group_instances') || 'Instances' }}</p>
                
                <div class="flex gap-2 mb-2">
                  <button 
                    @click="toggleAllInstancesSourcesCollective(true)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllInstancesSourcesCollective(false)"
                    class="cf-dropdown-action text-xs">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="inst in filteredInstanceSourcesCollective" 
                  :key="inst.sourceId"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterSourcesCollective.includes(inst.sourceId)"
                    @change="toggleSourceCollective(inst.sourceId)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ inst.name }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Items per page selector -->
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium cf-text-secondary">{{ $t('divers.prices_per_page') }}</label>
          <select
            v-model.number="itemsPerPageCollective"
            class="cf-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
        </div>
      </div>
      
      <!-- Info banner for collective prices -->
      <div class="bg-blue-900/30 border-2 border-blue-700/50 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm text-blue-200 mb-2">{{ $t('divers.prices_collective_info_equipment') }}</p>
            <p class="text-sm text-blue-200">{{ $t('divers.prices_collective_info_pet') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Collective Prices Table -->
      <PricesTable
        tab-type="collective"
        :all-items="allItemsCollective"
        :search-name="searchNameCollective"
        :filter-rarities="filterRaritiesCollective"
        :filter-level-min="filterLevelMinCollective"
        :filter-level-max="filterLevelMaxCollective"
        :filter-sources="filterSourcesCollective"
        :sort-column="sortColumnCollective"
        :sort-direction="sortDirectionCollective"
        :current-page="currentPageCollective"
        :items-per-page="itemsPerPageCollective"
        @sort-by="onSortByCollective"
        @update:current-page="currentPageCollective = $event"
        @update-price="onUpdatePrice"
        @clear-all="clearAllPrices"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useClickOutside } from '@/composables/useClickOutside'
import { getRarityClass } from '@/utils/itemHelpers'
import { getRarityName as getRarityNameUtil } from '@/utils/rarity'
import { useJsonStore } from '@/stores/useJsonStore'
import { useCollectivePricesStore } from '@/stores/useCollectivePricesStore'  // Firebase
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useAppStore } from '@/stores/useAppStore'
import { useI18n } from 'vue-i18n'
import PricesTable from '@/components/PricesTable.vue'

const { t } = useI18n()

const jsonStore = useJsonStore()
const collectivePricesStore = useCollectivePricesStore()  // Firebase
const personalPricesStore = usePersonalPricesStore()
const appStore = useAppStore()

// Cache pour les traductions des items et instances
const itemTranslationCache = new Map()
const instanceTranslationCache = new Map()

function getCachedItemName(itemId) {
  if (!itemTranslationCache.has(itemId)) {
    itemTranslationCache.set(itemId, t("items." + itemId) || `Item #${itemId}`)
  }
  return itemTranslationCache.get(itemId)
}

function getCachedInstanceName(instanceId) {
  if (!instanceTranslationCache.has(instanceId)) {
    instanceTranslationCache.set(instanceId, t("instances." + instanceId))
  }
  return instanceTranslationCache.get(instanceId)
}

function getHarvestJobName(skillId) {
  const key = `divers.harvest_job_skill_${skillId}`
  const translated = t(key)
  if (translated && translated !== key) return translated
  return `${t('divers.harvest_jobs_tab') || 'Métier'} #${skillId}`
}

// Active tab state
const activeTab = useLocalStorage(LS_KEYS.PRICES_ACTIVE_TAB, 'personal')

// ========================================
// PERSONAL TAB STATE
// ========================================

const searchNamePersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_SEARCH_NAME, '')
const filterRaritiesPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_RARITIES, [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMinPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_LEVEL_MIN, '')
const filterLevelMaxPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_LEVEL_MAX, '')
const sortColumnPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_SORT_COLUMN, 'name')
const sortDirectionPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_SORT_DIRECTION, 'asc')
const currentPagePersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_PAGE, 1)
const itemsPerPagePersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_PER_PAGE, 25)

const showAutocompletePersonal = ref(false)
const { elementRef: searchDropdownRefPersonal } = useClickOutside(() => {
  showAutocompletePersonal.value = false
})

const isRarityDropdownOpenPersonal = ref(false)
const { elementRef: rarityDropdownRefPersonal } = useClickOutside(() => {
  isRarityDropdownOpenPersonal.value = false
})

const filterSourcesPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_INSTANCES, [], { deep: true })

const isInstancesDropdownOpenPersonal = ref(false)
const { elementRef: instancesDropdownRefPersonal } = useClickOutside(() => {
  isInstancesDropdownOpenPersonal.value = false
})
const sourceSearchPersonal = ref('')

// ========================================
// COLLECTIVE TAB STATE
// ========================================

const searchNameCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_SEARCH_NAME, '')
const filterRaritiesCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_RARITIES, [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMinCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_LEVEL_MIN, '')
const filterLevelMaxCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_LEVEL_MAX, '')
const sortColumnCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_SORT_COLUMN, 'name')
const sortDirectionCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_SORT_DIRECTION, 'asc')
const currentPageCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_PAGE, 1)
const itemsPerPageCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_PER_PAGE, 25)

const showAutocompleteCollective = ref(false)
const { elementRef: searchDropdownRefCollective } = useClickOutside(() => {
  showAutocompleteCollective.value = false
})

const isRarityDropdownOpenCollective = ref(false)
const { elementRef: rarityDropdownRefCollective } = useClickOutside(() => {
  isRarityDropdownOpenCollective.value = false
})

const filterSourcesCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_INSTANCES, [], { deep: true })

const isInstancesDropdownOpenCollective = ref(false)
const { elementRef: instancesDropdownRefCollective } = useClickOutside(() => {
  isInstancesDropdownOpenCollective.value = false
})
const sourceSearchCollective = ref('')

if (sortColumnPersonal.value === 'instances') sortColumnPersonal.value = 'sources'
if (sortColumnCollective.value === 'instances') sortColumnCollective.value = 'sources'

// ========================================
// SHARED COMPUTED
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
  const raw = Array.isArray(jsonStore.rawHarvestResources) ? jsonStore.rawHarvestResources : []
  const uniqueSkillIds = [...new Set(raw.map(resource => Number(resource.jobSkillId)).filter(id => Number.isFinite(id) && id > 0))]

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

const filteredInstanceSourcesPersonal = computed(() => {
  if (!sourceSearchPersonal.value) return allSourcesList.value.instances
  const search = sourceSearchPersonal.value.toLowerCase()
  return allSourcesList.value.instances.filter(source => source.name.toLowerCase().includes(search))
})

const filteredJobSourcesPersonal = computed(() => {
  if (!sourceSearchPersonal.value) return allSourcesList.value.jobs
  const search = sourceSearchPersonal.value.toLowerCase()
  return allSourcesList.value.jobs.filter(source => source.name.toLowerCase().includes(search))
})

const filteredInstanceSourcesCollective = computed(() => {
  if (!sourceSearchCollective.value) return allSourcesList.value.instances
  const search = sourceSearchCollective.value.toLowerCase()
  return allSourcesList.value.instances.filter(source => source.name.toLowerCase().includes(search))
})

const filteredJobSourcesCollective = computed(() => {
  if (!sourceSearchCollective.value) return allSourcesList.value.jobs
  const search = sourceSearchCollective.value.toLowerCase()
  return allSourcesList.value.jobs.filter(source => source.name.toLowerCase().includes(search))
})

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

watch(allSourcesList, (newSources) => {
  if (newSources.flat.length === 0) return
  const stored = hasStoredFilter(LS_KEYS.PRICES_PERSONAL_INSTANCES)
  if (!stored && filterSourcesPersonal.value.length === 0) {
    filterSourcesPersonal.value = newSources.flat.map(source => source.sourceId)
    return
  }

  filterSourcesPersonal.value = normalizeStoredSourceIds(filterSourcesPersonal.value, newSources.flat)
}, { immediate: true })

watch(allSourcesList, (newSources) => {
  if (newSources.flat.length === 0) return
  const stored = hasStoredFilter(LS_KEYS.PRICES_COLLECTIVE_INSTANCES)
  if (!stored && filterSourcesCollective.value.length === 0) {
    filterSourcesCollective.value = newSources.flat.map(source => source.sourceId)
    return
  }

  filterSourcesCollective.value = normalizeStoredSourceIds(filterSourcesCollective.value, newSources.flat)
}, { immediate: true })

// ========================================
// PERSONAL TAB COMPUTED
// ========================================

const allItemsPersonal = computed(() => {
  const items = jsonStore.rawItems || []
  appStore.config  // Trigger dependency on config changes
  const currentServer = appStore.config.server
  const priceMap = personalPricesStore.prices[currentServer] || {}
  const itemInstances = jsonStore.itemToInstancesMap
  const harvestResources = Array.isArray(jsonStore.rawHarvestResources) ? jsonStore.rawHarvestResources : []

  const itemJobSkillIdsMap = new Map()
  harvestResources.forEach((resource) => {
    const skillId = Number(resource.jobSkillId)
    if (!Number.isFinite(skillId)) return
    const loots = Array.isArray(resource.loots) ? resource.loots : []
    loots.forEach((loot) => {
      const itemId = Number(loot.itemId)
      if (!Number.isFinite(itemId) || itemId <= 0) return
      if (!itemJobSkillIdsMap.has(itemId)) itemJobSkillIdsMap.set(itemId, new Set())
      itemJobSkillIdsMap.get(itemId).add(skillId)
    })
  })
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))

    const jobSkillIds = [...(itemJobSkillIdsMap.get(item.id) || new Set())].sort((a, b) => a - b)
    const jobNames = jobSkillIds
      .map(skillId => getHarvestJobName(skillId))
      .sort((a, b) => a.localeCompare(b))

    const sourceIds = [
      ...instanceIds.map(id => `instance:${id}`),
      ...jobSkillIds.map(skillId => `job:${skillId}`)
    ]
    const sourceNames = [...instanceNames, ...jobNames]
    
    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id]?.price || null,
      sourceIds,
      sources: sourceNames
    }
  })
})

const autocompleteItemsPersonal = computed(() => {
  if (!searchNamePersonal.value || searchNamePersonal.value.length < 2) return []
  const search = searchNamePersonal.value.toLowerCase()
  return allItemsPersonal.value
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// ========================================
// COLLECTIVE TAB COMPUTED
// ========================================

const allItemsCollective = computed(() => {
  const items = jsonStore.rawItems || []
  appStore.config  // Trigger dependency on config changes
  const currentServer = appStore.config.server
  const priceMap = collectivePricesStore.prices[currentServer] || {}
  const itemInstances = jsonStore.itemToInstancesMap
  const harvestResources = Array.isArray(jsonStore.rawHarvestResources) ? jsonStore.rawHarvestResources : []

  const itemJobSkillIdsMap = new Map()
  harvestResources.forEach((resource) => {
    const skillId = Number(resource.jobSkillId)
    if (!Number.isFinite(skillId)) return
    const loots = Array.isArray(resource.loots) ? resource.loots : []
    loots.forEach((loot) => {
      const itemId = Number(loot.itemId)
      if (!Number.isFinite(itemId) || itemId <= 0) return
      if (!itemJobSkillIdsMap.has(itemId)) itemJobSkillIdsMap.set(itemId, new Set())
      itemJobSkillIdsMap.get(itemId).add(skillId)
    })
  })
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))

    const jobSkillIds = [...(itemJobSkillIdsMap.get(item.id) || new Set())].sort((a, b) => a - b)
    const jobNames = jobSkillIds
      .map(skillId => getHarvestJobName(skillId))
      .sort((a, b) => a.localeCompare(b))

    const sourceIds = [
      ...instanceIds.map(id => `instance:${id}`),
      ...jobSkillIds.map(skillId => `job:${skillId}`)
    ]
    const sourceNames = [...instanceNames, ...jobNames]
    
    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id]?.price || null,
      sourceIds,
      sources: sourceNames
    }
  })
})

const autocompleteItemsCollective = computed(() => {
  if (!searchNameCollective.value || searchNameCollective.value.length < 2) return []
  const search = searchNameCollective.value.toLowerCase()
  return allItemsCollective.value
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// Force reactivity on Firebase prices changes - Vue doesn't always detect nested object changes
watch(
  () => collectivePricesStore.prices,
  () => {
    // Trigger re-computation by accessing allItemsCollective
    allItemsCollective.value
  },
  { deep: true }
)

// ========================================
// HANDLERS
// ========================================

function getRarityName(rarityIndex) {
  return getRarityNameUtil(t, rarityIndex)
}

function getRarityDisplayTextPersonal() {
  if (filterRaritiesPersonal.value.length === 0) return t('divers.none_selected')
  if (filterRaritiesPersonal.value.length === 8) return t('divers.all_selected')
  return `${filterRaritiesPersonal.value.length} sélectionné(e)s`
}

function getRarityDisplayTextCollective() {
  if (filterRaritiesCollective.value.length === 0) return t('divers.none_selected')
  if (filterRaritiesCollective.value.length === 8) return t('divers.all_selected')
  return `${filterRaritiesCollective.value.length} sélectionné(e)s`
}

function getSourcesDisplayTextPersonal() {
  const fi = filterSourcesPersonal.value || []
  if (fi.length === 0) return t('divers.none_selected')
  if (fi.length === allSourcesList.value.flat.length) return t('divers.all_selected')
  return `${fi.length} ${t('divers.selected_count')}`
}

function getSourcesDisplayTextCollective() {
  const fi = filterSourcesCollective.value || []
  if (fi.length === 0) return t('divers.none_selected')
  if (fi.length === allSourcesList.value.flat.length) return t('divers.all_selected')
  return `${fi.length} ${t('divers.selected_count')}`
}

// Rarity toggle functions
function toggleRarityPersonal(rarity) {
  if (filterRaritiesPersonal.value.includes(rarity)) {
    filterRaritiesPersonal.value = filterRaritiesPersonal.value.filter(r => r !== rarity)
  } else {
    filterRaritiesPersonal.value.push(rarity)
  }
}

function toggleAllRaritiesPersonal(value) {
  if (value) {
    filterRaritiesPersonal.value = [0, 1, 2, 3, 4, 5, 6, 7]
  } else {
    filterRaritiesPersonal.value = []
  }
}

function toggleRarityCollective(rarity) {
  if (filterRaritiesCollective.value.includes(rarity)) {
    filterRaritiesCollective.value = filterRaritiesCollective.value.filter(r => r !== rarity)
  } else {
    filterRaritiesCollective.value.push(rarity)
  }
}

function toggleAllRaritiesCollective(value) {
  if (value) {
    filterRaritiesCollective.value = [0, 1, 2, 3, 4, 5, 6, 7]
  } else {
    filterRaritiesCollective.value = []
  }
}

// Level validation functions
function validateLevelMinPersonal(event) {
  let val = parseInt(event.target.value)
  if (val < 1) val = 1
  if (val > 245) val = 245
  if (filterLevelMaxPersonal.value && val > filterLevelMaxPersonal.value) {
    val = filterLevelMaxPersonal.value
  }
  filterLevelMinPersonal.value = val || ''
  event.target.value = filterLevelMinPersonal.value
}

function validateLevelMaxPersonal(event) {
  let val = parseInt(event.target.value)
  if (val < 1) val = 1
  if (val > 245) val = 245
  if (filterLevelMinPersonal.value && val < filterLevelMinPersonal.value) {
    val = filterLevelMinPersonal.value
  }
  filterLevelMaxPersonal.value = val || ''
  event.target.value = filterLevelMaxPersonal.value
}

function validateLevelMinCollective(event) {
  let val = parseInt(event.target.value)
  if (val < 1) val = 1
  if (val > 245) val = 245
  if (filterLevelMaxCollective.value && val > filterLevelMaxCollective.value) {
    val = filterLevelMaxCollective.value
  }
  filterLevelMinCollective.value = val || ''
  event.target.value = filterLevelMinCollective.value
}

function validateLevelMaxCollective(event) {
  let val = parseInt(event.target.value)
  if (val < 1) val = 1
  if (val > 245) val = 245
  if (filterLevelMinCollective.value && val < filterLevelMinCollective.value) {
    val = filterLevelMinCollective.value
  }
  filterLevelMaxCollective.value = val || ''
  event.target.value = filterLevelMaxCollective.value
}

// Source toggle functions
function toggleSourcePersonal(sourceId) {
  if (filterSourcesPersonal.value.includes(sourceId)) {
    filterSourcesPersonal.value = filterSourcesPersonal.value.filter(id => id !== sourceId)
  } else {
    filterSourcesPersonal.value.push(sourceId)
  }
}

function toggleAllSourcesPersonal(value) {
  if (value) {
    filterSourcesPersonal.value = allSourcesList.value.flat.map(source => source.sourceId)
  } else {
    filterSourcesPersonal.value = []
  }
}

function toggleAllInstancesSourcesPersonal(value) {
  const instanceSourceIds = allSourcesList.value.instances.map(source => source.sourceId)
  if (value) {
    const existingJobs = filterSourcesPersonal.value.filter(id => id.startsWith('job:'))
    filterSourcesPersonal.value = [...existingJobs, ...instanceSourceIds]
  } else {
    filterSourcesPersonal.value = filterSourcesPersonal.value.filter(id => id.startsWith('job:'))
  }
}

function toggleAllJobsSourcesPersonal(value) {
  const jobSourceIds = allSourcesList.value.jobs.map(source => source.sourceId)
  if (value) {
    const existingInstances = filterSourcesPersonal.value.filter(id => id.startsWith('instance:'))
    filterSourcesPersonal.value = [...existingInstances, ...jobSourceIds]
  } else {
    filterSourcesPersonal.value = filterSourcesPersonal.value.filter(id => id.startsWith('instance:'))
  }
}

function toggleSourceCollective(sourceId) {
  if (filterSourcesCollective.value.includes(sourceId)) {
    filterSourcesCollective.value = filterSourcesCollective.value.filter(id => id !== sourceId)
  } else {
    filterSourcesCollective.value.push(sourceId)
  }
}

function toggleAllSourcesCollective(value) {
  if (value) {
    filterSourcesCollective.value = allSourcesList.value.flat.map(source => source.sourceId)
  } else {
    filterSourcesCollective.value = []
  }
}

function toggleAllInstancesSourcesCollective(value) {
  const instanceSourceIds = allSourcesList.value.instances.map(source => source.sourceId)
  if (value) {
    const existingJobs = filterSourcesCollective.value.filter(id => id.startsWith('job:'))
    filterSourcesCollective.value = [...existingJobs, ...instanceSourceIds]
  } else {
    filterSourcesCollective.value = filterSourcesCollective.value.filter(id => id.startsWith('job:'))
  }
}

function toggleAllJobsSourcesCollective(value) {
  const jobSourceIds = allSourcesList.value.jobs.map(source => source.sourceId)
  if (value) {
    const existingInstances = filterSourcesCollective.value.filter(id => id.startsWith('instance:'))
    filterSourcesCollective.value = [...existingInstances, ...jobSourceIds]
  } else {
    filterSourcesCollective.value = filterSourcesCollective.value.filter(id => id.startsWith('instance:'))
  }
}

// Search handlers
function onSearchInputPersonal() {
  showAutocompletePersonal.value = searchNamePersonal.value.length >= 2
}

function onSearchInputCollective() {
  showAutocompleteCollective.value = searchNameCollective.value.length >= 2
}

function selectItemPersonal(item) {
  searchNamePersonal.value = item.name
  showAutocompletePersonal.value = false
}

function selectItemCollective(item) {
  searchNameCollective.value = item.name
  showAutocompleteCollective.value = false
}

// Sort handlers
function onSortByPersonal(column) {
  if (sortColumnPersonal.value === column) {
    sortDirectionPersonal.value = sortDirectionPersonal.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumnPersonal.value = column
    sortDirectionPersonal.value = 'asc'
  }
}

function onSortByCollective(column) {
  if (sortColumnCollective.value === column) {
    sortDirectionCollective.value = sortDirectionCollective.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumnCollective.value = column
    sortDirectionCollective.value = 'asc'
  }
}

// Price update handler (unified for both tabs)
function onUpdatePrice({ itemId, newPrice, tabType }) {
  const server = appStore.config.server
  
  if (tabType === 'personal') {
    personalPricesStore.updatePrice(server, itemId, newPrice)
  } else {
    collectivePricesStore.updatePrice(server, itemId, newPrice)
  }
}

// Clear handlers
function clearAllPersonalPrices() {
  if (confirm(t('divers.prices_clear_personal_confirm') || 'Are you sure?')) {
    personalPricesStore.clearAll()
  }
}

function clearAllPrices() {
  if (confirm(t('divers.confirm_clear_all_prices') || 'Are you sure?')) {
    collectivePricesStore.clearAllPrices()
  }
}

watch([searchNamePersonal, filterRaritiesPersonal, filterLevelMinPersonal, filterLevelMaxPersonal, filterSourcesPersonal, itemsPerPagePersonal], () => {
  currentPagePersonal.value = 1
})

watch([searchNameCollective, filterRaritiesCollective, filterLevelMinCollective, filterLevelMaxCollective, filterSourcesCollective, itemsPerPageCollective], () => {
  currentPageCollective.value = 1
})
</script>
