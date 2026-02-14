<template>
  <div class="min-h-screen flex flex-col bg-slate-900">

    <AppHeader />
    
    <main class="grow">
      <div v-if="!jsonStore.loaded" class="p-8 text-center">
        <p class="text-lg text-orange-400">{{$t('divers.loading')}}</p>
      </div>

      <RentabilityRunView v-if="mainTab === 'rentability'" />

      <RentabilityHourView v-else-if="mainTab === 'runs'" />

      <PricesView v-else-if="mainTab === 'prices'" />

      <SettingsView v-else-if="mainTab === 'settings'" />
    </main>
    
    <AppFooter />

    <!-- Toast alerts (temporary notifications) -->
    <ToastAlerts />
    
    <!-- Debug overlay -->
    <DebugOverlay :visible="devToolsStore.showDebug" @close="devToolsStore.showDebug = false" />
    
    <!-- Console overlay -->
    <ConsoleOverlay :visible="devToolsStore.showConsole" @close="devToolsStore.showConsole = false" />

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useDevToolsStore } from '@/stores/useDevToolsStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useUpdateChecker } from '@/composables/useUpdateChecker'
import { LS_KEYS } from '@/constants/localStorageKeys'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RentabilityRunView from '@/views/RentabilityRunView.vue'
import RentabilityHourView from '@/views/RentabilityHourView.vue'
import PricesView from '@/views/PricesView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ToastAlerts from '@/components/ToastAlerts.vue'
import DebugOverlay from '@/components/DebugOverlay.vue'
import ConsoleOverlay from '@/components/ConsoleOverlay.vue'

const appStore = useAppStore()
const jsonStore = useJsonStore()
const devToolsStore = useDevToolsStore()

// Tab state with localStorage persistence (shared ref)
const mainTab = useLocalStorage(LS_KEYS.MAIN_TAB, 'rentability')
const minimizeToTray = useLocalStorage(LS_KEYS.SETTINGS_MINIMIZE_TO_TRAY, false)

const UPDATE_REPO = 'Volminoduro/wakfarm'

const { checkForUpdates } = useUpdateChecker({ repo: UPDATE_REPO })

// Charger les données au montage
onMounted(async () => {
  // Always show window on startup (unless minimize-to-tray enabled)
  try {
    await invoke('set_minimize_to_tray_enabled', { enabled: !!minimizeToTray.value })
    // Show window on every normal startup (not hidden in tray)
    await invoke('show_window')
  } catch (error) {
    console.warn('Unable to show window:', error)
  }

  // Load app data
  await appStore.initData(appStore.config.server)

  // Keyboard shortcut handler for dev overlays
  const handleKeydown = (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.metaKey && e.altKey && e.key === 'i')) {
      e.preventDefault()
      devToolsStore.toggleConsole()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)

  // Update check (Windows portable)
  checkForUpdates()
})

</script>
