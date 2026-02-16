<template>
  <div class="px-8 py-6 max-w-480 mx-auto">
    <div class="cf-panel">
      <div class="flex items-center gap-2 mb-4">
        <input
          id="launchOnStartup"
          type="checkbox"
          :checked="isAutostartEnabled"
          @change="toggleAutostart"
          :disabled="autostartLoading"
        />
        <label for="launchOnStartup" class="cf-text-normal">
          {{ $t('divers.settings.launchOnStartup') }}
        </label>
      </div>
      <div class="flex items-center gap-2">
        <input
          id="minimizeToTray"
          type="checkbox"
          v-model="minimizeToTray"
        />
        <label for="minimizeToTray" class="cf-text-normal">
          {{ $t('divers.settings.minimizeToTray') }}
        </label>
      </div>
    </div>

    <!-- Development Tools Section -->
    <div class="cf-panel mt-8 border border-slate-700">
      <h3 class="text-sm font-bold text-slate-300 mb-4 uppercase">Dev Tools</h3>
      <div class="flex gap-2">
        <button 
          @click="devToolsStore.toggleDebug()"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
        >
          🐛 Debug Info
        </button>
        <button 
          @click="devToolsStore.toggleConsole()"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
        >
          📋 Console (F12)
        </button>
      </div>
      <p class="text-xs text-slate-400 mt-2">Press Ctrl+Shift+I to toggle console</p>
    </div>
  </div>
</template>

<script setup>
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useAutostart } from '@/composables/useAutostart'
import { useMinimizeToTray } from '@/composables/useMinimizeToTray'
import { useDevToolsStore } from '@/stores/useDevToolsStore'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { watch, onMounted } from 'vue'

const minimizeToTray = useLocalStorage(LS_KEYS.SETTINGS_MINIMIZE_TO_TRAY, false)
const { isAutostartEnabled, isLoading: autostartLoading, toggleAutostart } = useAutostart()
const { setupCloseToTray } = useMinimizeToTray()
const devToolsStore = useDevToolsStore()

// Setup close to tray when setting changes
onMounted(() => {
  watch(minimizeToTray, (enabled) => {
    setupCloseToTray(enabled)
  }, { immediate: true })
})
</script>