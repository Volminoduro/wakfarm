<template>
  <div class="px-8 py-6 max-w-480 mx-auto">
    <!-- Filters and Pagination Controls -->
    <div class="bg-secondary border-2 border-wakfu-gray rounded-lg p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- Search by name -->
        <div class="relative" ref="searchDropdownRef">
          <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_search_name') }}</label>
          <input
            v-model="searchName"
            @input="onSearchInput"
            @focus="showAutocomplete = true"
            type="text"
            :placeholder="$t('divers.prices_search_placeholder')"
            class="cf-input w-full rounded px-3 py-2"
          />
          
          <div v-if="showAutocomplete && autocompleteItems.length > 0" 
            class="cf-dropdown">
            <div class="p-1">
              <button
                v-for="item in autocompleteItems"
                :key="item.id"
                @click="selectItem(item)"
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
        <div class="relative" ref="rarityDropdownRef">
          <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_rarity') }}</label>
          <button
            @click="isRarityDropdownOpen = !isRarityDropdownOpen"
            class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
            <span>{{ getRarityDisplayText() }}</span>
            <span>{{ isRarityDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          
          <div v-if="isRarityDropdownOpen" 
            class="cf-dropdown">
            <div class="p-2 space-y-1">
                <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                <button 
                  @click="toggleAllRarities(true)"
                  class="cf-dropdown-action">
                  {{ $t('divers.level_ranges_toggle_all') }}
                </button>
                <button 
                  @click="toggleAllRarities(false)"
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
                  :checked="filterRarities.includes(r-1)"
                  @change="toggleRarity(r-1)"
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
                v-model.number="filterLevelMin"
                @input="validateLevelMin"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_min')"
                class="cf-input w-full rounded px-3 py-2"
              />
            <input
              v-model.number="filterLevelMax"
              @input="validateLevelMax"
              type="number"
              min="1"
              max="245"
              :placeholder="$t('divers.prices_max')"
              class="cf-input w-full rounded px-3 py-2"
            />
          </div>
        </div>
        
        <!-- Filter by instances -->
        <div class="relative" ref="instancesDropdownRef">
          <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_instances') }}</label>
          <button
            @click="isInstancesDropdownOpen = !isInstancesDropdownOpen"
            class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
            <span>{{ getInstancesDisplayText() }}</span>
            <span>{{ isInstancesDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          
          <div v-if="isInstancesDropdownOpen" 
            class="cf-dropdown">
            <div class="p-2 space-y-1">
                <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                <button 
                  @click="toggleAllInstances(true)"
                  class="cf-dropdown-action">
                  {{ $t('divers.level_ranges_toggle_all') }}
                </button>
                <button 
                  @click="toggleAllInstances(false)"
                  class="cf-dropdown-action">
                  {{ $t('divers.level_ranges_toggle_none') }}
                </button>
              </div>
              
              <label 
                v-for="inst in allInstancesList" 
                :key="inst.id"
                class="cf-dropdown-item">
                <input
                  type="checkbox"
                  :checked="filterInstances.includes(inst.id)"
                  @change="toggleInstance(inst.id)"
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
          v-model.number="itemsPerPage"
          class="cf-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </div>
    </div>
    
    <!-- Table -->
    <div class="cf-card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="font-bold truncate text-slate-100">
            <tr>
              <th @click="sortBy('name')" :class="['cf-table-header','cf-table-header--hover']">
                <div class="flex items-center gap-2">
                  {{ $t('divers.prices_col_name') }}
                  <span v-if="sortColumn === 'name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
              <th @click="sortBy('level')" :class="['cf-table-header','cf-table-header--hover']">
                <div class="flex items-center gap-2">
                  {{ $t('divers.prices_col_level') }}
                  <span v-if="sortColumn === 'level'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
              <th @click="sortBy('instances')" :class="['cf-table-header','cf-table-header--hover']">
                <div class="flex items-center gap-2">
                  {{ $t('divers.prices_col_instances') }}
                  <span v-if="sortColumn === 'instances'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
              <th @click="sortBy('price')" :class="['cf-table-header','cf-table-header--hover','text-right']">
                <div class="flex items-center justify-end gap-2">
                  {{ $t('divers.prices_col_price') }}
                  <span v-if="sortColumn === 'price'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in paginatedItems" 
              :key="item.id"
              class="cf-table-row-hover">
              <td class="px-4 py-3">
                <span :class="['font-bold', getRarityClass(item.rarity)]">
                  {{ item.name }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-200">{{ item.level }}</td>
              <td class="px-4 py-3 cf-text-secondary">
                <span v-if="item.instances && item.instances.length > 0" class="text-sm">
                  {{ item.instances.join(', ') }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-4 py-3 text-right text-kamas">
                <span v-if="item.price != null">{{ formatNumber(item.price) }} ₭</span>
                <span v-else class="text-slate-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Footer with pagination -->
      <div class="px-4 py-3 border-t border-wakfu-gray text-slate-100 flex items-center justify-between">
        <p :class="['text-sm']">
          {{ $t('divers.prices_showing') }} {{ startItem }} - {{ endItem }} {{ $t('divers.prices_of') }} {{ filteredAndSortedItems.length }} {{ $t('divers.prices_items') }}
        </p>
        
        <div class="flex items-center gap-2">
          <button @click="currentPage = 1" :disabled="currentPage === 1" :class="['cf-pag-btn', currentPage === 1 ? 'opacity-50 cursor-not-allowed' : '']">««</button>
          <button @click="currentPage--" :disabled="currentPage === 1" :class="['cf-pag-btn', currentPage === 1 ? 'opacity-50 cursor-not-allowed' : '']">‹</button>
          
          <span class="px-4 text-sm text-slate-200">
            {{ $t('divers.prices_page') }} {{ currentPage }} / {{ totalPages }}
          </span>
          
          <button @click="currentPage++" :disabled="currentPage === totalPages" :class="['cf-pag-btn', currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : '']">›</button>
          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" :class="['cf-pag-btn', currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : '']">»»</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useClickOutside } from '@/composables/useClickOutside'
import { getRarityClass } from '@/utils/itemHelpers'
import { formatNumber } from '@/utils/formatters'
import { useJsonStore } from '@/stores/useJsonStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const jsonStore = useJsonStore()

// Filters with localStorage persistence
const searchName = useLocalStorage(LS_KEYS.PRICES_SEARCH_NAME, '')
const filterRarities = useLocalStorage(LS_KEYS.PRICES_RARITIES, [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMin = useLocalStorage(LS_KEYS.PRICES_LEVEL_MIN, '')
const filterLevelMax = useLocalStorage(LS_KEYS.PRICES_LEVEL_MAX, '')
const sortColumn = useLocalStorage(LS_KEYS.PRICES_SORT_COLUMN, 'name')
const sortDirection = useLocalStorage(LS_KEYS.PRICES_SORT_DIRECTION, 'asc')
const currentPage = useLocalStorage(LS_KEYS.PRICES_PAGE, 1)
const itemsPerPage = useLocalStorage(LS_KEYS.PRICES_PER_PAGE, 25)

// Search autocomplete
const showAutocomplete = ref(false)
const { elementRef: searchDropdownRef } = useClickOutside(() => {
  showAutocomplete.value = false
})

// Rarity dropdown
const isRarityDropdownOpen = ref(false)
const { elementRef: rarityDropdownRef } = useClickOutside(() => {
  isRarityDropdownOpen.value = false
})

// Get all instances for the filter
const allInstancesList = computed(() => {
  const instances = jsonStore.rawInstances || []
  return instances.map(inst => ({
    id: inst.id,
    name: t("instances." + inst.id)
  })).sort((a, b) => a.name.localeCompare(b.name))
})

// Instances filter with special initialization logic
// Use `null` as the sentinel default so we can detect "never saved" without direct localStorage access
const filterInstances = useLocalStorage(LS_KEYS.PRICES_INSTANCES, null, { deep: true })

// Initialize with all instances if never saved
watch(allInstancesList, (newList) => {
  if (filterInstances.value === null && newList.length > 0) {
    filterInstances.value = newList.map(i => i.id)
  }
}, { immediate: true })

// Instances dropdown
const isInstancesDropdownOpen = ref(false)
const { elementRef: instancesDropdownRef } = useClickOutside(() => {
  isInstancesDropdownOpen.value = false
})

// Get all items with names, prices, and instances (using store getters)
const allItems = computed(() => {
  const items = jsonStore.rawItems || []
  const priceMap = jsonStore.priceMap
  const itemInstances = jsonStore.itemToInstancesMap
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => t("instances." + id))
      .sort((a, b) => a.localeCompare(b))
    
    return {
      id: item.id,
      name: t("items." + item.id) || `Item #${item.id}`,
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id] || null,
      instanceIds: instanceIds,
      instances: instanceNames
    }
  })
})

// Autocomplete suggestions
const autocompleteItems = computed(() => {
  if (!searchName.value || searchName.value.length < 2) return []
  
  const search = searchName.value.toLowerCase()
  return allItems.value
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10) // Limit to 10 suggestions
})

// Filter and sort items
const filteredAndSortedItems = computed(() => {
  let result = [...allItems.value]
  
  // Filter by name
  if (searchName.value) {
    const search = searchName.value.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(search))
  }
  
  // Filter by rarity
  if (filterRarities.value.length === 0) {
    result = [] // None selected = hide all
  } else if (filterRarities.value.length < 8) {
    result = result.filter(item => filterRarities.value.includes(item.rarity))
  }
  // All selected = show all (no filter)
  
  // Filter by level
  if (filterLevelMin.value !== '' && filterLevelMin.value != null) {
    result = result.filter(item => item.level >= filterLevelMin.value)
  }
  if (filterLevelMax.value !== '' && filterLevelMax.value != null) {
    result = result.filter(item => item.level <= filterLevelMax.value)
  }
  
  // Filter by instances
  const fi = filterInstances.value || []
  if (fi.length === 0) {
    result = [] // None selected = hide all
  } else if (fi.length < allInstancesList.value.length) {
    result = result.filter(item => {
      // Item must be found in at least one selected instance
      return item.instanceIds.some(instId => fi.includes(instId))
    })
  }
  // All selected = show all (no filter)
  
  // Sort
  result.sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Handle instances sorting by count
    if (sortColumn.value === 'instances') {
      aVal = a.instanceIds?.length || 0
      bVal = b.instanceIds?.length || 0
    }
    // Handle null prices
    else if (sortColumn.value === 'price') {
      aVal = aVal ?? -1
      bVal = bVal ?? -1
    }
    // Handle string comparison
    else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredAndSortedItems.value.length / itemsPerPage.value)
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAndSortedItems.value.slice(start, end)
})

const startItem = computed(() => {
  if (filteredAndSortedItems.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, filteredAndSortedItems.value.length)
})

// Reset to page 1 when filters change
watch([searchName, filterRarities, filterLevelMin, filterLevelMax, filterInstances, itemsPerPage], () => {
  currentPage.value = 1
})

// Search helpers
function onSearchInput() {
  showAutocomplete.value = searchName.value.length >= 2
}

function selectItem(item) {
  searchName.value = item.name
  showAutocomplete.value = false
}

// Rarity filter helpers
function toggleRarity(rarity) {
  const index = filterRarities.value.indexOf(rarity)
  if (index === -1) {
    filterRarities.value.push(rarity)
  } else {
    filterRarities.value.splice(index, 1)
  }
}

function toggleAllRarities(selectAll) {
  filterRarities.value = selectAll ? [0, 1, 2, 3, 4, 5, 6, 7] : []
  isRarityDropdownOpen.value = false
}

function getRarityDisplayText() {
  const count = filterRarities.value.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === 8) return t('divers.level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/8`
}

// Instance filter helpers
function toggleInstance(instanceId) {
  const arr = filterInstances.value || []
  const index = arr.indexOf(instanceId)
  if (index === -1) {
    arr.push(instanceId)
  } else {
    arr.splice(index, 1)
  }
  filterInstances.value = arr
}

function toggleAllInstances(selectAll) {
  filterInstances.value = selectAll ? allInstancesList.value.map(i => i.id) : []
  isInstancesDropdownOpen.value = false
}

function getInstancesDisplayText() {
  const arr = filterInstances.value || []
  const count = arr.length
  const total = allInstancesList.value.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === total) return t('divers.level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/${total}`
}

// Level validation helpers
function validateLevelMin(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMin.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMin.value = 1
    } else if (num > 245) {
      filterLevelMin.value = 245
    } else {
      filterLevelMin.value = num
    }
  }
}

function validateLevelMax(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMax.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMax.value = 1
    } else if (num > 245) {
      filterLevelMax.value = 245
    } else {
      filterLevelMax.value = num
    }
  }
}

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getRarityName(rarity) {
  const names = {
    0: t('divers.rarity_common'),
    1: t('divers.rarity_unusual'),
    2: t('divers.rarity_rare'),
    3: t('divers.rarity_mythical'),
    4: t('divers.rarity_legendary'),
    5: t('divers.rarity_relic'),
    6: t('divers.rarity_souvenir'),
    7: t('divers.rarity_epic')
  }
  return names[rarity] || t('divers.rarity_common')
}
</script>
