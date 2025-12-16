<template>
    <div class="px-8 py-6 max-w-[1920px] mx-auto">
        <div :class="[COLOR_CLASSES.bgSecondary, 'border-2 border-[#363634] rounded-lg', 'rounded-lg p-3 mb-3']">            
                <div class="flex items-center gap-2 mb-2">
                    <label for="folderPath" :class="COLOR_CLASSES.textNormal">{{ $t('divers.settings.folderPath') }}</label>
                    <button type="button" @click="selectFolder" class="px-2 py-1 bg-slate-700 rounded text-xs">
                        {{ $t('divers.settings.chooseFolder') }}
                    </button>
                </div>
                <label :class="[COLOR_CLASSES.textNormal, 'break-all']">{{ folderPath }}</label>
        </div>
        <div :class="[COLOR_CLASSES.bgSecondary, 'border-2 border-[#363634] rounded-lg', 'rounded-lg p-3']">
              <input
                id="launchOnStartup"
                type="checkbox"
                v-model="launchOnStartup"
              />
              <label :class="[COLOR_CLASSES.textNormal, 'p-2']">{{ $t('divers.settings.launchOnStartup') }}</label>
            <div class="mt-4 flex items-center gap-2">
              <input
                id="minimizeToTray"
                type="checkbox"
                v-model="minimizeToTray"
              />
              <label for="minimizeToTray" :class="COLOR_CLASSES.textNormal">
                {{ $t('divers.settings.minimizeToTray') }}
              </label>
            </div>
        </div>
    </div>
</template>

<script setup>
import { COLOR_CLASSES } from '@/constants/colors'
import { open } from '@tauri-apps/plugin-dialog'
import { useLocalStorage } from '@/composables/useLocalStorage'
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

const folderPath = useLocalStorage("settings.folderPath")
const launchOnStartup = useLocalStorage("settings.launchOnStartup", false)
const minimizeToTray = useLocalStorage("settings.minimizeToTray", false)
// Synchronise l'option minimizeToTray avec le backend Rust
/* watch(minimizeToTray, (val) => {
  invoke('set_minimize_to_tray', { value: val });
}, { immediate: true }); */
</script>