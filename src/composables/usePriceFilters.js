import { ref, computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useClickOutside } from '@/composables/useClickOutside'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useI18n } from 'vue-i18n'

/**
 * Composable pour gérer la logique des filtres de prix (personnels et collectifs)
 * Permet de mutualiser le code entre les deux onglets de PricesView.vue
 */
export function usePriceFilters(tabType = 'personal') {
  const { t } = useI18n()

  // Déterminer les clés de localStorage selon le type d'onglet
  const getStorageKey = (key) => {
    if (tabType === 'personal') {
      return key.replace('_personal', '_personal')
    } else {
      return key.replace('_personal', '_collective')
    }
  }

  // État de filtre pour search
  const searchName = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_SEARCH_NAME : LS_KEYS.PRICES_COLLECTIVE_SEARCH_NAME,
    ''
  )

  // État de filtre pour rarité
  const filterRarities = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_RARITIES : LS_KEYS.PRICES_COLLECTIVE_RARITIES,
    [0, 1, 2, 3, 4, 5, 6, 7],
    { deep: true }
  )

  // État de filtre pour niveau
  const filterLevelMin = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_LEVEL_MIN : LS_KEYS.PRICES_COLLECTIVE_LEVEL_MIN,
    ''
  )
  const filterLevelMax = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_LEVEL_MAX : LS_KEYS.PRICES_COLLECTIVE_LEVEL_MAX,
    ''
  )

  // État de filtre pour instances
  const filterInstances = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_INSTANCES : LS_KEYS.PRICES_COLLECTIVE_INSTANCES,
    null,
    { deep: true }
  )

  // État de tri
  const sortColumn = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_SORT_COLUMN : LS_KEYS.PRICES_COLLECTIVE_SORT_COLUMN,
    'name'
  )
  const sortDirection = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_SORT_DIRECTION : LS_KEYS.PRICES_COLLECTIVE_SORT_DIRECTION,
    'asc'
  )

  // État de pagination
  const currentPage = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_PAGE : LS_KEYS.PRICES_COLLECTIVE_PAGE,
    1
  )
  const itemsPerPage = useLocalStorage(
    tabType === 'personal' ? LS_KEYS.PRICES_PERSONAL_PER_PAGE : LS_KEYS.PRICES_COLLECTIVE_PER_PAGE,
    25
  )

  // UI State
  const showAutocomplete = ref(false)
  const { elementRef: searchDropdownRef } = useClickOutside(() => {
    showAutocomplete.value = false
  })

  const isRarityDropdownOpen = ref(false)
  const { elementRef: rarityDropdownRef } = useClickOutside(() => {
    isRarityDropdownOpen.value = false
  })

  const isInstancesDropdownOpen = ref(false)
  const { elementRef: instancesDropdownRef } = useClickOutside(() => {
    isInstancesDropdownOpen.value = false
  })

  const instanceSearch = ref('')

  // ========================================
  // Handlers
  // ========================================

  function getRarityDisplayText() {
    if (filterRarities.value.length === 0) return t('divers.none_selected')
    if (filterRarities.value.length === 8) return t('divers.all_selected')
    return `${filterRarities.value.length} ${t('divers.selected_count')}`
  }

  function getInstancesDisplayText(allInstancesLength) {
    const fi = filterInstances.value || []
    if (fi.length === 0) return t('divers.none_selected')
    if (fi.length === allInstancesLength) return t('divers.all_selected')
    return `${fi.length} ${t('divers.selected_count')}`
  }

  function toggleRarity(rarity) {
    if (filterRarities.value.includes(rarity)) {
      filterRarities.value = filterRarities.value.filter(r => r !== rarity)
    } else {
      filterRarities.value.push(rarity)
    }
  }

  function toggleAllRarities(value) {
    if (value) {
      filterRarities.value = [0, 1, 2, 3, 4, 5, 6, 7]
    } else {
      filterRarities.value = []
    }
  }

  function validateLevelMin(event) {
    let val = parseInt(event.target.value)
    if (val < 1) val = 1
    if (val > 245) val = 245
    if (filterLevelMax.value && val > filterLevelMax.value) {
      val = filterLevelMax.value
    }
    filterLevelMin.value = val || ''
    event.target.value = filterLevelMin.value
  }

  function validateLevelMax(event) {
    let val = parseInt(event.target.value)
    if (val < 1) val = 1
    if (val > 245) val = 245
    if (filterLevelMin.value && val < filterLevelMin.value) {
      val = filterLevelMin.value
    }
    filterLevelMax.value = val || ''
    event.target.value = filterLevelMax.value
  }

  function toggleInstance(instanceId) {
    if (filterInstances.value.includes(instanceId)) {
      filterInstances.value = filterInstances.value.filter(id => id !== instanceId)
    } else {
      filterInstances.value.push(instanceId)
    }
  }

  function toggleAllInstances(value, allInstancesList) {
    if (value) {
      filterInstances.value = allInstancesList.map(i => i.id)
    } else {
      filterInstances.value = []
    }
  }

  function onSearchInput() {
    showAutocomplete.value = searchName.value.length >= 2
  }

  function selectItem(item) {
    searchName.value = item.name
    showAutocomplete.value = false
  }

  function sortBy(column) {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = column
      sortDirection.value = 'asc'
    }
  }

  function resetPage() {
    currentPage.value = 1
  }

  return {
    // State
    searchName,
    filterRarities,
    filterLevelMin,
    filterLevelMax,
    filterInstances,
    sortColumn,
    sortDirection,
    currentPage,
    itemsPerPage,
    showAutocomplete,
    isRarityDropdownOpen,
    isInstancesDropdownOpen,
    instanceSearch,

    // Refs
    searchDropdownRef,
    rarityDropdownRef,
    instancesDropdownRef,

    // Methods
    getRarityDisplayText,
    getInstancesDisplayText,
    toggleRarity,
    toggleAllRarities,
    validateLevelMin,
    validateLevelMax,
    toggleInstance,
    toggleAllInstances,
    onSearchInput,
    selectItem,
    sortBy,
    resetPage
  }
}
