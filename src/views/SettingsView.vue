<template>
        <div class="px-8 py-6 max-w-480 mx-auto">
          <div class="cf-panel mb-3">            
          <div class="flex items-center gap-2 mb-2">
              <label for="folderPath" class="cf-text-normal">{{ $t('divers.settings.folderPath') }}</label>
              <button type="button" @click="selectFolder" class="px-2 py-1 bg-slate-700 rounded text-xs">
                  {{ $t('divers.settings.chooseFolder') }}
              </button>
          </div>
          <label class="cf-text-normal break-all">{{ folderPath }}</label>
          <div class="flex items-center">
            <input
            id="deleteAfterOCR"
            type="checkbox"
            v-model="deleteAfterOCR"
            />
            <label class="cf-text-normal p-2">{{ $t('divers.settings.deleteAfterOCR') }}</label>
          </div>
        </div>
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
import { open } from '@tauri-apps/plugin-dialog'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { join, homeDir } from '@tauri-apps/api/path';

async function selectFolder() {
  try {
    let defaultPath = folderPath.value;
    if (!defaultPath) {
      const home = await homeDir();
      defaultPath = await join(
        home,
        'AppData',
        'Roaming',
        'zaap',
        'gamesLogs',
        'wakfu',
        'screenshots'
      );
    }
    const file = await open({
      multiple: false,
      directory: true,
      defaultPath
    });
    if (file && typeof file === 'string') {
      folderPath.value = file;
    }
  } catch (e) {
    console.error('Erreur lors de la sélection du dossier', e);
  }
}

const folderPath = useLocalStorage(LS_KEYS.SETTINGS_FOLDER_PATH)
const deleteAfterOCR = useLocalStorage(LS_KEYS.SETTINGS_DELETE_AFTER_OCR, false)
const launchOnStartup = useLocalStorage(LS_KEYS.SETTINGS_LAUNCH_ON_STARTUP, false)
const minimizeToTray = useLocalStorage(LS_KEYS.SETTINGS_MINIMIZE_TO_TRAY, false)
// Synchronise l'option minimizeToTray avec le backend Rust
/* watch(minimizeToTray, (val) => {
  invoke('set_minimize_to_tray', { value: val });
}, { immediate: true }); */
</script>