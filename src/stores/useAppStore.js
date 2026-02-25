import { defineStore } from 'pinia'
import { computed } from 'vue'
import { DEFAULT_CONFIG } from '@/constants'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useJsonStore } from '@/stores/useJsonStore'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useAppStore = defineStore('app', () => {
  const MENU_SCOPES = [
    'rentability',
    'runs_time',
    'runs_config',
    'harvest_time',
    'harvest_config',
    'craft_kamas',
    'craft_jobs',
    'prices_collective',
    'prices_personal',
    'settings'
  ]

  const mainTab = useLocalStorage(LS_KEYS.MAIN_TAB, 'rentability')
  const runsSubTab = useLocalStorage(LS_KEYS.RUNS_SUBTAB, 'time')
  const craftSubTab = useLocalStorage(LS_KEYS.CRAFT_SUBTAB, 'kamas')
  const pricesSubTab = useLocalStorage(LS_KEYS.PRICES_ACTIVE_TAB, 'personal')
  const shareFiltersBetweenMenus = useLocalStorage(LS_KEYS.SETTINGS_SHARE_FILTERS_BETWEEN_MENUS, true)

  function normalizeConfig(rawConfig) {
    try {
      return { ...DEFAULT_CONFIG, ...(rawConfig || {}) }
    } catch {
      return { ...DEFAULT_CONFIG }
    }
  }

  function buildDefaultConfigsByMenu() {
    return MENU_SCOPES.reduce((acc, scope) => {
      acc[scope] = { ...DEFAULT_CONFIG }
      return acc
    }, {})
  }

  function normalizeConfigsByMenu(rawConfigs) {
    const defaults = buildDefaultConfigsByMenu()
    const source = rawConfigs || {}

    const legacySourceByScope = {
      rentability: source.dungeons,
      runs_time: source.dungeons,
      runs_config: source.dungeons,
      harvest_time: source.harvest,
      harvest_config: source.harvest,
      craft_kamas: source.craft,
      craft_jobs: source.craft,
      prices_collective: source.prices,
      prices_personal: source.prices,
      settings: source.settings
    }

    MENU_SCOPES.forEach((scope) => {
      let candidate = source[scope]
      if (!candidate) {
        candidate = legacySourceByScope[scope]
      }
      defaults[scope] = normalizeConfig(candidate)
    })
    return defaults
  }

  const sharedConfig = useLocalStorage(LS_KEYS.CONFIG, { ...DEFAULT_CONFIG }, { deep: true })
  const configsByMenu = useLocalStorage(LS_KEYS.CONFIG_BY_MENU, buildDefaultConfigsByMenu(), { deep: true })

  sharedConfig.value = normalizeConfig(sharedConfig.value)
  configsByMenu.value = normalizeConfigsByMenu(configsByMenu.value)

  const activeFilterScope = computed(() => {
    if (mainTab.value === 'rentability') return 'rentability'
    if (mainTab.value === 'runs') return runsSubTab.value === 'config' ? 'runs_config' : 'runs_time'
    if (mainTab.value === 'harvest') return runsSubTab.value === 'harvest' ? 'harvest_config' : 'harvest_time'
    if (mainTab.value === 'craft') return craftSubTab.value === 'jobs' ? 'craft_jobs' : 'craft_kamas'
    if (mainTab.value === 'prices') return pricesSubTab.value === 'collective' ? 'prices_collective' : 'prices_personal'
    return 'settings'
  })

  const config = computed({
    get() {
      if (shareFiltersBetweenMenus.value) {
        return sharedConfig.value
      }

      const scope = activeFilterScope.value
      const existing = configsByMenu.value?.[scope]
      if (existing) return existing

      const fallback = normalizeConfig(sharedConfig.value)
      configsByMenu.value = {
        ...configsByMenu.value,
        [scope]: fallback
      }
      return configsByMenu.value[scope]
    },
    set(newConfig) {
      const normalized = normalizeConfig(newConfig)
      if (shareFiltersBetweenMenus.value) {
        sharedConfig.value = normalized
      } else {
        configsByMenu.value = {
          ...configsByMenu.value,
          [activeFilterScope.value]: normalized
        }
      }
    }
  })

  // Compose other stores
  const jsonStore = useJsonStore()

  // Initialize main data on app start
  async function initData(server) {
    try {
      await jsonStore.loadAllData(server)
      // Servers are now loaded. Validate persisted config.server is in the list
      if (jsonStore.servers && jsonStore.servers.length > 0) {
        const configured = config.value?.server
        const valid = jsonStore.servers.find(s => s.id === configured)
        if (!valid) {
          // Current server not in list - reset to default or first available
          const fallback = DEFAULT_CONFIG.server || jsonStore.servers[0].id
          config.value.server = fallback
        }
      }
    } catch (e) {
      console.error('Erreur initData', e)
    }
  }

  return {
    // persisted app-level state
    config,
    shareFiltersBetweenMenus,
    initData
  }
})