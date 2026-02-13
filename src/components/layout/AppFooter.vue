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

const version = ref('')

onMounted(async () => {
  try {
    // Try to get version from Tauri directly (don't check __TAURI__)
    const ver = await getVersion()
    if (ver) {
      version.value = ver
      console.log('Footer: Got version from Tauri:', ver)
      return
    }
  } catch (error) {
    console.log('Footer: Tauri getVersion failed:', error.message)
  }
  
  // Fallback to fetching package.json
  try {
    const response = await fetch('/package.json')
    if (response.ok) {
      const pkg = await response.json()
      if (pkg.version) {
        version.value = pkg.version
        console.log('Footer: Got version from package.json:', pkg.version)
      }
    }
  } catch (error) {
    console.error('Footer: Failed to get version from package.json:', error)
  }
})
</script>
