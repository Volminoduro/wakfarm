<template>
  <div>
    <!-- Table -->
    <div class="cf-card">
      <div class="overflow-x-auto">
        <table class="w-full table-fixed">
          <colgroup>
            <col style="width:30%" />
            <col style="width:20%" />
            <col style="width:30%" />
            <col style="width:20%" />
                  <input
                    type="text"
                    :value="formatInputNumber(item.price)"
                    @blur="onPriceUpdate(item.id, $event.target.value)"
                    :placeholder="'—'"
                    :title="getPriceLastUpdated(appStore.config.server, item.id) ? `Modifié: ${formatTimestamp(getPriceLastUpdated(appStore.config.server, item.id))}` : 'Pas de prix'"
                    class="cf-input text-right w-full bg-transparent border-none focus:bg-slate-700 focus:border-slate-500 kamas-input-padding"
                  />
                  {{ $t('divers.prices_col_level') }}
                  <span class="inline-block w-3 text-center">{{ sortColumn === 'level' ? (sortDirection === 'asc' ? '▲' : '▼') : '' }}</span>
                </div>
              </th>
              <th @click="sortBy('instances')" :class="['cf-table-header','cf-table-header--hover']">
                <div class="flex items-center gap-2">
                  {{ $t('divers.prices_col_instances') }}
                  <span class="inline-block w-3 text-center">{{ sortColumn === 'instances' ? (sortDirection === 'asc' ? '▲' : '▼') : '' }}</span>
                </div>
              </th>
              <th @click="sortBy('price')" :class="['cf-table-header','cf-table-header--hover','text-right']">
                <div class="flex items-center justify-end gap-2">
                  {{ $t('divers.prices_col_price') }}
                  <span class="inline-block w-3 text-center">{{ sortColumn === 'price' ? (sortDirection === 'asc' ? '▲' : '▼') : '' }}</span>
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
                <div class="input-wrapper w-48 mx-auto">
                  <input
                    type="number"
                    :value="item.price"
                    @blur="onPriceUpdate(item.id, $event.target.value)"
                    :placeholder="'—'"
                    :title="getPriceLastUpdated(appStore.config.server, item.id) ? `Modifié: ${formatTimestamp(getPriceLastUpdated(appStore.config.server, item.id))}` : 'Pas de prix'"
                    class="cf-input text-right w-full bg-transparent border-none focus:bg-slate-700 focus:border-slate-500 kamas-input-padding"
                    min="0"
                    max="1000000000"
                    step="1"
                  />
                  <span class="kamas-icon">₭</span>
                </div>
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
          <button 
            v-if="tabType === 'personal'"
            @click="onClearAll"
            class="cf-pag-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
            🗑️ {{ $t('divers.prices_clear_personal') }}
          </button>
          
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
import { computed } from 'vue'
import { getRarityClass } from '@/utils/itemHelpers'
import { usePriceLogic } from '@/composables/usePriceLogic'
import { useAppStore } from '@/stores/useAppStore'

const props = defineProps({
  // Data source
  allItems: {
    type: Array,
    required: true,
    default: () => []
  },
  
  // Tab type to determine behavior
  tabType: {
    type: String,
    enum: ['personal', 'collective'],
    required: true
  },
  
  // Filter states (passed from parent)
  searchName: {
    type: String,
    default: ''
  },
  filterRarities: {
    type: Array,
    default: () => [0, 1, 2, 3, 4, 5, 6, 7]
  },
  filterLevelMin: {
    type: [String, Number],
    default: ''
  },
  filterLevelMax: {
    type: [String, Number],
    default: ''
  },
  filterInstances: {
    type: Array,
    default: () => []
  },
  
  // Sort/pagination states (passed from parent)
  sortColumn: {
    type: String,
    default: 'name'
  },
  sortDirection: {
    type: String,
    default: 'asc'
  },
  currentPage: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 25
  }
})

const emit = defineEmits(['sort-by', 'update:currentPage', 'update-price', 'clear-all'])

const appStore = useAppStore()
const { getPriceLastUpdated, formatTimestamp } = usePriceLogic()

// Sort handler
function sortBy(column) {
  emit('sort-by', column)
}

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredAndSortedItems.value.length / props.itemsPerPage)
})

const paginatedItems = computed(() => {
  const start = (props.currentPage - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredAndSortedItems.value.slice(start, end)
})

const startItem = computed(() => {
  if (filteredAndSortedItems.value.length === 0) return 0
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return Math.min(end, filteredAndSortedItems.value.length)
})

// Filter and sort items
const filteredAndSortedItems = computed(() => {
  let result = [...props.allItems]
  
  // Filter by name
  if (props.searchName) {
    const search = props.searchName.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(search))
  }
  
  // Filter by rarity
  if (props.filterRarities.length === 0) {
    result = []
  } else if (props.filterRarities.length < 8) {
    result = result.filter(item => props.filterRarities.includes(item.rarity))
  }
  
  // Filter by level
  if (props.filterLevelMin !== '' && props.filterLevelMin != null) {
    result = result.filter(item => item.level >= props.filterLevelMin)
  }
  if (props.filterLevelMax !== '' && props.filterLevelMax != null) {
    result = result.filter(item => item.level <= props.filterLevelMax)
  }
  
  // Filter by instances
  const fi = props.filterInstances || []
  if (fi.length === 0) {
    result = []
  } else if (fi.length < 100) { // Assuming max ~100 instances
    result = result.filter(item => {
      return item.instanceIds.some(instId => fi.includes(instId))
    })
  }
  
  // Sort
  result.sort((a, b) => {
    let aVal = a[props.sortColumn]
    let bVal = b[props.sortColumn]
    
    if (props.sortColumn === 'instances') {
      aVal = a.instanceIds?.length || 0
      bVal = b.instanceIds?.length || 0
    } else if (props.sortColumn === 'price') {
      aVal = aVal ?? -1
      bVal = bVal ?? -1
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return props.sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return props.sortDirection === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

// Event handlers
function onPriceUpdate(itemId, newPrice) {
  // newPrice may be formatted (spaces, french decimal comma). Parse to raw number.
  const cleaned = parseFormattedNumber(newPrice || '').replace(',', '.')
  const numeric = cleaned === '' ? null : Number(cleaned)
  emit('update-price', { itemId, newPrice: numeric, tabType: props.tabType })
}

function onClearAll() {
  emit('clear-all')
}
</script>
