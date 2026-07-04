<template>
  <div>
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
            class="cf-select min-w-40 w-auto text-left flex items-center justify-between">
            <span>{{ rarityDisplayText }}</span>
            <span>{{ isRarityDropdownOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="isRarityDropdownOpen"
            class="cf-dropdown">
            <div class="p-2 space-y-1">
              <div class="flex gap-2 mb-2 pb-2">
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

        <!-- Filter by sources -->
        <div class="relative" ref="sourcesDropdownRef">
          <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_sources') || $t('divers.prices_filter_instances') }}</label>
          <button
            @click="isSourcesDropdownOpen = !isSourcesDropdownOpen"
            class="cf-select min-w-40 w-auto text-left flex items-center justify-between">
            <span>{{ sourcesDisplayText }}</span>
            <span>{{ isSourcesDropdownOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="isSourcesDropdownOpen"
            class="cf-dropdown">
            <div class="p-2 space-y-1">
              <input
                v-model="sourceSearch"
                type="text"
                :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                @click.stop
              />
              <div class="flex gap-2 mb-2 pb-2">
                <button
                  @click="toggleAllSources(true)"
                  class="cf-dropdown-action">
                  {{ $t('divers.level_ranges_toggle_all') }}
                </button>
                <button
                  @click="toggleAllSources(false)"
                  class="cf-dropdown-action">
                  {{ $t('divers.level_ranges_toggle_none') }}
                </button>
              </div>

              <div class="border-t border-slate-600 my-2"></div>

              <p class="text-xs uppercase tracking-wide cf-text-secondary mt-2 mb-1">{{ $t('divers.prices_sources_group_jobs') || 'Métiers' }}</p>

              <div class="flex gap-2 mb-2">
                <button
                  @click="toggleSourceGroup('job', true)"
                  class="cf-dropdown-action text-xs">
                  {{ $t('divers.level_ranges_toggle_all') }}
                </button>
                <button
                  @click="toggleSourceGroup('job', false)"
                  class="cf-dropdown-action text-xs">
                  {{ $t('divers.level_ranges_toggle_none') }}
                </button>
              </div>

              <label
                v-for="job in filteredJobSources"
                :key="job.sourceId"
                class="cf-dropdown-item">
                <input
                  type="checkbox"
                  :checked="filterSources.includes(job.sourceId)"
                  @change="toggleSource(job.sourceId)"
                  class="custom-checkbox-small"
                />
                <span class="text-slate-200 flex items-center gap-2">
                  <JobIcon :job-id="job.id" :size="16" />
                  {{ job.name }}
                </span>
              </label>

              <p class="text-xs uppercase tracking-wide cf-text-secondary mt-2 mb-1">{{ $t('divers.prices_sources_group_instances') || 'Instances' }}</p>

              <div class="flex gap-2 mb-2">
                <button
                  @click="toggleSourceGroup('instance', true)"
                  class="cf-dropdown-action text-xs">
                  {{ $t('divers.level_ranges_toggle_all') }}
                </button>
                <button
                  @click="toggleSourceGroup('instance', false)"
                  class="cf-dropdown-action text-xs">
                  {{ $t('divers.level_ranges_toggle_none') }}
                </button>
              </div>

              <label
                v-for="inst in filteredInstanceSources"
                :key="inst.sourceId"
                class="cf-dropdown-item">
                <input
                  type="checkbox"
                  :checked="filterSources.includes(inst.sourceId)"
                  @change="toggleSource(inst.sourceId)"
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
          v-model.number="itemsPerPage"
          class="cf-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </div>
    </div>

    <!-- Info banner -->
    <div class="bg-blue-900/30 border-2 border-blue-700/50 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <p v-if="tabType === 'personal'" class="text-sm text-blue-200">{{ $t('divers.prices_personal_info') }}</p>
          <template v-else>
            <p class="text-sm text-blue-200 mb-2">{{ $t('divers.prices_collective_info_equipment') }}</p>
            <p class="text-sm text-blue-200">{{ $t('divers.prices_collective_info_pet') }}</p>
          </template>
        </div>
      </div>
    </div>

    <!-- Prices Table -->
    <PricesTable
      :tab-type="tabType"
      :all-items="allItems"
      :search-name="searchName"
      :filter-rarities="filterRarities"
      :filter-level-min="filterLevelMin"
      :filter-level-max="filterLevelMax"
      :filter-sources="filterSources"
      :sort-column="sortColumn"
      :sort-direction="sortDirection"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      @sort-by="onSortBy"
      @update:current-page="currentPage = $event"
      @update-price="$emit('update-price', $event)"
      @clear-all="$emit('clear-all')"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useClickOutside } from '@/composables/useClickOutside'
import { getRarityClass } from '@/utils/itemHelpers'
import { getRarityName as getRarityNameUtil } from '@/utils/rarity'
import PricesTable from '@/components/PricesTable.vue'
import JobIcon from '@/components/JobIcon.vue'

const { t } = useI18n()

const props = defineProps({
  // 'personal' | 'collective' — choisit le jeu de clés localStorage et les libellés
  tabType: {
    type: String,
    required: true
  },
  // Items avec prix déjà superposés (construits par PricesView)
  allItems: {
    type: Array,
    required: true,
    default: () => []
  },
  // { instances: [...], jobs: [...], flat: [...] } — sources filtrables (cf. PricesView)
  sources: {
    type: Object,
    required: true
  }
})

defineEmits(['update-price', 'clear-all'])

// ========================================
// ÉTAT PERSISTÉ (clés localStorage par onglet)
// useLocalStorage met en cache les refs par clé : le même état est partagé avec
// PricesView (normalisation des sources) sans prop-drilling.
// ========================================

const K = props.tabType === 'personal'
  ? {
      search: LS_KEYS.PRICES_PERSONAL_SEARCH_NAME,
      rarities: LS_KEYS.PRICES_PERSONAL_RARITIES,
      levelMin: LS_KEYS.PRICES_PERSONAL_LEVEL_MIN,
      levelMax: LS_KEYS.PRICES_PERSONAL_LEVEL_MAX,
      sortColumn: LS_KEYS.PRICES_PERSONAL_SORT_COLUMN,
      sortDirection: LS_KEYS.PRICES_PERSONAL_SORT_DIRECTION,
      page: LS_KEYS.PRICES_PERSONAL_PAGE,
      perPage: LS_KEYS.PRICES_PERSONAL_PER_PAGE,
      sources: LS_KEYS.PRICES_PERSONAL_INSTANCES
    }
  : {
      search: LS_KEYS.PRICES_COLLECTIVE_SEARCH_NAME,
      rarities: LS_KEYS.PRICES_COLLECTIVE_RARITIES,
      levelMin: LS_KEYS.PRICES_COLLECTIVE_LEVEL_MIN,
      levelMax: LS_KEYS.PRICES_COLLECTIVE_LEVEL_MAX,
      sortColumn: LS_KEYS.PRICES_COLLECTIVE_SORT_COLUMN,
      sortDirection: LS_KEYS.PRICES_COLLECTIVE_SORT_DIRECTION,
      page: LS_KEYS.PRICES_COLLECTIVE_PAGE,
      perPage: LS_KEYS.PRICES_COLLECTIVE_PER_PAGE,
      sources: LS_KEYS.PRICES_COLLECTIVE_INSTANCES
    }

const searchName = useLocalStorage(K.search, '')
const filterRarities = useLocalStorage(K.rarities, [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMin = useLocalStorage(K.levelMin, '')
const filterLevelMax = useLocalStorage(K.levelMax, '')
const sortColumn = useLocalStorage(K.sortColumn, 'name')
const sortDirection = useLocalStorage(K.sortDirection, 'asc')
const currentPage = useLocalStorage(K.page, 1)
const itemsPerPage = useLocalStorage(K.perPage, 25)
const filterSources = useLocalStorage(K.sources, [], { deep: true })

// Migration : l'ancienne colonne de tri 'instances' est devenue 'sources'
if (sortColumn.value === 'instances') sortColumn.value = 'sources'

// ========================================
// ÉTAT UI (dropdowns, recherche de source)
// ========================================

const showAutocomplete = ref(false)
const { elementRef: searchDropdownRef } = useClickOutside(() => {
  showAutocomplete.value = false
})

const isRarityDropdownOpen = ref(false)
const { elementRef: rarityDropdownRef } = useClickOutside(() => {
  isRarityDropdownOpen.value = false
})

const isSourcesDropdownOpen = ref(false)
const { elementRef: sourcesDropdownRef } = useClickOutside(() => {
  isSourcesDropdownOpen.value = false
})
const sourceSearch = ref('')

// ========================================
// COMPUTED
// ========================================

const autocompleteItems = computed(() => {
  if (!searchName.value || searchName.value.length < 2) return []
  const search = searchName.value.toLowerCase()
  return props.allItems
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10)
})

function formatSelectionDisplay(selectedCount, totalCount) {
  if (selectedCount === 0) return t('divers.level_ranges_none')
  if (selectedCount === totalCount) return t('divers.all_selected_short')
  return `${selectedCount}/${totalCount}`
}

const rarityDisplayText = computed(() => formatSelectionDisplay(filterRarities.value.length, 8))

const sourcesDisplayText = computed(() =>
  formatSelectionDisplay((filterSources.value || []).length, props.sources.flat.length)
)

function filterBySearch(sources) {
  if (!sourceSearch.value) return sources
  const search = sourceSearch.value.toLowerCase()
  return sources.filter(source => source.name.toLowerCase().includes(search))
}

const filteredJobSources = computed(() => filterBySearch(props.sources.jobs))
const filteredInstanceSources = computed(() => filterBySearch(props.sources.instances))

// ========================================
// HANDLERS
// ========================================

function getRarityName(rarityIndex) {
  return getRarityNameUtil(t, rarityIndex)
}

function toggleRarity(rarity) {
  if (filterRarities.value.includes(rarity)) {
    filterRarities.value = filterRarities.value.filter(r => r !== rarity)
  } else {
    filterRarities.value.push(rarity)
  }
}

function toggleAllRarities(value) {
  filterRarities.value = value ? [0, 1, 2, 3, 4, 5, 6, 7] : []
}

function makeLevelValidator(ownRef, otherRef, clampToOther) {
  return (event) => {
    let val = parseInt(event.target.value)
    if (val < 1) val = 1
    if (val > 245) val = 245
    if (otherRef.value && clampToOther(val, otherRef.value)) {
      val = otherRef.value
    }
    ownRef.value = val || ''
    event.target.value = ownRef.value
  }
}

const validateLevelMin = makeLevelValidator(filterLevelMin, filterLevelMax, (v, other) => v > other)
const validateLevelMax = makeLevelValidator(filterLevelMax, filterLevelMin, (v, other) => v < other)

function toggleSource(sourceId) {
  if (filterSources.value.includes(sourceId)) {
    filterSources.value = filterSources.value.filter(id => id !== sourceId)
  } else {
    filterSources.value.push(sourceId)
  }
}

function toggleAllSources(value) {
  filterSources.value = value ? props.sources.flat.map(source => source.sourceId) : []
}

// Coche/décoche tout un groupe ('job' ou 'instance') sans toucher à l'autre groupe
function toggleSourceGroup(group, value) {
  const prefix = `${group}:`
  const kept = filterSources.value.filter(id => !id.startsWith(prefix))
  if (value) {
    const groupIds = props.sources.flat
      .filter(source => source.sourceId.startsWith(prefix))
      .map(source => source.sourceId)
    filterSources.value = [...kept, ...groupIds]
  } else {
    filterSources.value = kept
  }
}

function onSearchInput() {
  showAutocomplete.value = searchName.value.length >= 2
}

function selectItem(item) {
  searchName.value = item.name
  showAutocomplete.value = false
}

function onSortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// Retour page 1 dès qu'un filtre change
watch([searchName, filterRarities, filterLevelMin, filterLevelMax, filterSources, itemsPerPage], () => {
  currentPage.value = 1
})
</script>
