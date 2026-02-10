import { defineStore } from 'pinia'
import { DEFAULT_CONFIG } from '@/constants'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useJsonStore } from '@/stores/useJsonStore'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useAppStore = defineStore('app', () => {
  const LS_KEY = LS_KEYS.CONFIG
  // Persisted config (merge with defaults)
  const config = useLocalStorage(LS_KEY, { ...DEFAULT_CONFIG }, { deep: true })
  // Ensure missing default keys are present (in case stored value is partial)
  try {
    config.value = { ...DEFAULT_CONFIG, ...config.value }
  } catch (e) {
    config.value = { ...DEFAULT_CONFIG }
  }
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
    initData
  }
})