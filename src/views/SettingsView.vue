<template>
  <div class="px-8 py-6 max-w-480 mx-auto">
    <div class="cf-panel">
      <input
        id="launchOnStartup"
        type="checkbox"
        v-model="launchOnStartup"
      />
      <label class="cf-text-normal p-2">{{ $t('divers.settings.launchOnStartup') }}</label>
      <div class="mt-4 flex items-center gap-2">
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
import { LS_KEYS } from '@/constants/localStorageKeys'

const launchOnStartup = useLocalStorage(LS_KEYS.SETTINGS_LAUNCH_ON_STARTUP, false)
const minimizeToTray = useLocalStorage(LS_KEYS.SETTINGS_MINIMIZE_TO_TRAY, false)
// Synchronise l'option minimizeToTray avec le backend Rust
/* watch(minimizeToTray, (val) => {
  invoke('set_minimize_to_tray', { value: val });
}, { immediate: true }); */
</script>