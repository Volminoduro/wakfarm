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
  </div>
</template>

<script setup>
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useAutostart } from '@/composables/useAutostart'
import { useMinimizeToTray } from '@/composables/useMinimizeToTray'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { watch, onMounted } from 'vue'

const minimizeToTray = useLocalStorage(LS_KEYS.SETTINGS_MINIMIZE_TO_TRAY, false)
const { isAutostartEnabled, isLoading: autostartLoading, toggleAutostart } = useAutostart()
const { setupCloseToTray } = useMinimizeToTray()

// Setup close to tray when setting changes
onMounted(() => {
  watch(minimizeToTray, (enabled) => {
    setupCloseToTray(enabled)
  }, { immediate: true })
})
</script>