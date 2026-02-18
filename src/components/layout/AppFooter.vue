<template>
  <footer class="cf-footer ">
    <div class="flex justify-between items-center">
      <p>{{ $t('divers.footer_title') }}<span v-if="version" class="ml-2 opacity-50">v{{ version }}</span></p>
      <p>{{ $t('divers.footer_steles_update') }} xx.xx.xxxx</p>
      <p class="flex items-center gap-2">
        <span>{{ $t('divers.footer_disclaimer') }}</span>
        <span class="text-xs opacity-70">• {{ $t('divers.footer_contact') }}: <span class="font-mono">.vesperal</span></span>
      </p>
    </div>
  </footer>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getVersion } from '@tauri-apps/api/app'
import { isRunningInTauri } from '@/utils/machineId'

const version = ref('')

onMounted(async () => {
  // Only try Tauri if running in Tauri
  if (isRunningInTauri()) {
    try {
      const ver = await getVersion()
      if (ver) {
        version.value = ver
        console.log('Footer: Got version from Tauri:', ver)
        return
      }
    } catch (error) {
      console.log('Footer: Tauri getVersion failed:', error.message)
    }
  }
  
  // Fallback to build-time version (from vite.config.js define)
  if (import.meta.env.VITE_APP_VERSION) {
    version.value = import.meta.env.VITE_APP_VERSION
    console.log('Footer: Got version from build:', import.meta.env.VITE_APP_VERSION)
  }
})
</script>
