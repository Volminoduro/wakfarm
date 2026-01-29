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
          
          <!-- Filter by instances -->
          <div class="relative" ref="instancesDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_instances') }}</label>
            <button
              @click="isInstancesDropdownOpenPersonal = !isInstancesDropdownOpenPersonal"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getInstancesDisplayTextPersonal() }}</span>
              <span>{{ isInstancesDropdownOpenPersonal ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isInstancesDropdownOpenPersonal" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <input
                  v-model="instanceSearchPersonal"
                  type="text"
                  :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                  class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                  @click.stop
                />
                <div class="flex gap-2 mb-2 pb-2">
                  <button 
                    @click="toggleAllInstancesPersonal(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllInstancesPersonal(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="inst in filteredInstancesListPersonal" 
                  :key="inst.id"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterInstancesPersonal.includes(inst.id)"
                    @change="toggleInstancePersonal(inst.id)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ $t("instances." + inst.id) }}
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
      
      <!-- Personal Prices Table -->
      <PricesTable
        tab-type="personal"
        :all-items="allItemsPersonal"
        :search-name="searchNamePersonal"
        :filter-rarities="filterRaritiesPersonal"
        :filter-level-min="filterLevelMinPersonal"
        :filter-level-max="filterLevelMaxPersonal"
        :filter-instances="filterInstancesPersonal"
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
          
          <!-- Filter by instances -->
          <div class="relative" ref="instancesDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_instances') }}</label>
            <button
              @click="isInstancesDropdownOpenCollective = !isInstancesDropdownOpenCollective"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getInstancesDisplayTextCollective() }}</span>
              <span>{{ isInstancesDropdownOpenCollective ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isInstancesDropdownOpenCollective" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <input
                  v-model="instanceSearchCollective"
                  type="text"
                  :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                  class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                  @click.stop
                />
                <div class="flex gap-2 mb-2 pb-2">
                  <button 
                    @click="toggleAllInstancesCollective(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllInstancesCollective(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="inst in filteredInstancesListCollective" 
                  :key="inst.id"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterInstancesCollective.includes(inst.id)"
                    @change="toggleInstanceCollective(inst.id)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ $t("instances." + inst.id) }}
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
      
      <!-- Collective Prices Table -->
      <PricesTable
        tab-type="collective"
        :all-items="allItemsCollective"
        :search-name="searchNameCollective"
        :filter-rarities="filterRaritiesCollective"
        :filter-level-min="filterLevelMinCollective"
        :filter-level-max="filterLevelMaxCollective"
        :filter-instances="filterInstancesCollective"
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
import { useP2PStore } from '@/stores/useP2PStore'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useAppStore } from '@/stores/useAppStore'
import { useI18n } from 'vue-i18n'
import PricesTable from '@/components/PricesTable.vue'

const { t } = useI18n()

const jsonStore = useJsonStore()
const p2pStore = useP2PStore()
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

const filterInstancesPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_INSTANCES, null, { deep: true })

const isInstancesDropdownOpenPersonal = ref(false)
const { elementRef: instancesDropdownRefPersonal } = useClickOutside(() => {
  isInstancesDropdownOpenPersonal.value = false
})
const instanceSearchPersonal = ref('')

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

const filterInstancesCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_INSTANCES, null, { deep: true })

const isInstancesDropdownOpenCollective = ref(false)
const { elementRef: instancesDropdownRefCollective } = useClickOutside(() => {
  isInstancesDropdownOpenCollective.value = false
})
const instanceSearchCollective = ref('')

// ========================================
// SHARED COMPUTED
// ========================================

const allInstancesList = computed(() => {
  const instances = jsonStore.rawInstances || []
  return instances
    .filter(inst => inst.isActive !== false)
    .map(inst => ({
      id: inst.id,
      name: getCachedInstanceName(inst.id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const filteredInstancesListPersonal = computed(() => {
  if (!instanceSearchPersonal.value) return allInstancesList.value
  const search = instanceSearchPersonal.value.toLowerCase()
  return allInstancesList.value.filter(inst => inst.name.toLowerCase().includes(search))
})

const filteredInstancesListCollective = computed(() => {
  if (!instanceSearchCollective.value) return allInstancesList.value
  const search = instanceSearchCollective.value.toLowerCase()
  return allInstancesList.value.filter(inst => inst.name.toLowerCase().includes(search))
})

watch(allInstancesList, (newList) => {
  if (filterInstancesPersonal.value === null && newList.length > 0) {
    filterInstancesPersonal.value = newList.map(i => i.id)
  }
}, { immediate: true })

watch(allInstancesList, (newList) => {
  if (filterInstancesCollective.value === null && newList.length > 0) {
    filterInstancesCollective.value = newList.map(i => i.id)
  }
}, { immediate: true })

// ========================================
// PERSONAL TAB COMPUTED
// ========================================

const allItemsPersonal = computed(() => {
  const items = jsonStore.rawItems || []
  const currentServer = appStore.config.server
  const priceMap = personalPricesStore.prices[currentServer] || {}
  const itemInstances = jsonStore.itemToInstancesMap
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))
    
    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id]?.price || null,
      instanceIds: instanceIds,
      instances: instanceNames
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
  const currentServer = appStore.config.server
  const priceMap = p2pStore.prices[currentServer] || {}
  const itemInstances = jsonStore.itemToInstancesMap
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))
    
    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id]?.price || null,
      instanceIds: instanceIds,
      instances: instanceNames
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

function getInstancesDisplayTextPersonal() {
  const fi = filterInstancesPersonal.value || []
  if (fi.length === 0) return t('divers.none_selected')
  if (fi.length === allInstancesList.value.length) return t('divers.all_selected')
  return `${fi.length} ${t('divers.selected_count')}`
}

function getInstancesDisplayTextCollective() {
  const fi = filterInstancesCollective.value || []
  if (fi.length === 0) return t('divers.none_selected')
  if (fi.length === allInstancesList.value.length) return t('divers.all_selected')
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

// Instance toggle functions
function toggleInstancePersonal(instanceId) {
  if (filterInstancesPersonal.value.includes(instanceId)) {
    filterInstancesPersonal.value = filterInstancesPersonal.value.filter(id => id !== instanceId)
  } else {
    filterInstancesPersonal.value.push(instanceId)
  }
}

function toggleAllInstancesPersonal(value) {
  if (value) {
    filterInstancesPersonal.value = allInstancesList.value.map(i => i.id)
  } else {
    filterInstancesPersonal.value = []
  }
}

function toggleInstanceCollective(instanceId) {
  if (filterInstancesCollective.value.includes(instanceId)) {
    filterInstancesCollective.value = filterInstancesCollective.value.filter(id => id !== instanceId)
  } else {
    filterInstancesCollective.value.push(instanceId)
  }
}

function toggleAllInstancesCollective(value) {
  if (value) {
    filterInstancesCollective.value = allInstancesList.value.map(i => i.id)
  } else {
    filterInstancesCollective.value = []
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
  if (tabType === 'personal') {
    personalPricesStore.updatePrice(appStore.config.server, itemId, newPrice)
  } else {
    p2pStore.updatePrice(appStore.config.server, itemId, newPrice)
  }
}

// Clear handlers
function clearAllPersonalPrices() {
  if (confirm(t('divers.confirm_clear_personal_prices') || 'Are you sure?')) {
    personalPricesStore.clearAll()
  }
}

function clearAllPrices() {
  if (confirm(t('divers.confirm_clear_all_prices') || 'Are you sure?')) {
    p2pStore.clearAllPrices()
  }
}

watch([searchNamePersonal, filterRaritiesPersonal, filterLevelMinPersonal, filterLevelMaxPersonal, filterInstancesPersonal, itemsPerPagePersonal], () => {
  currentPagePersonal.value = 1
})

watch([searchNameCollective, filterRaritiesCollective, filterLevelMinCollective, filterLevelMaxCollective, filterInstancesCollective, itemsPerPageCollective], () => {
  currentPageCollective.value = 1
})
</script>
