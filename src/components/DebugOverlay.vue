<template>
  <div v-if="visible" class="fixed bottom-20 right-4 bg-slate-800 text-white p-4 rounded shadow-lg text-xs max-w-md z-50 space-y-1 font-mono border border-slate-600">
    <div class="flex justify-between items-center mb-2">
      <span class="font-bold text-sm">Debug Info</span>
      <button @click="$emit('close')" class="text-slate-400 hover:text-white">✕</button>
    </div>
    <div><strong>Version:</strong> {{ version || 'N/A' }}</div>
    <div><strong>Platform:</strong> {{ platform }}</div>
    <div><strong>Tauri:</strong> {{ hasTauri ? '✓' : '✗' }}</div>
    <div><strong>DEV mode:</strong> {{ isDev ? '✓' : '✗' }}</div>
    <div><strong>Update Check:</strong> {{ updateStatus }}</div>
    <div v-if="latestVersion"><strong>Latest:</strong> {{ latestVersion }}</div>
    <div v-if="error" class="text-red-400 mt-2 break-words"><strong>Error:</strong> {{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { getVersion } from '@tauri-apps/api/app'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const version = ref('')
const platform = ref('')
const hasTauri = ref(false)
const isDev = ref(import.meta.env.DEV)
const updateStatus = ref('not checked')
const latestVersion = ref('')
const error = ref('')

onMounted(async () => {
  // Check platform
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || ''
    if (/windows/i.test(ua)) platform.value = 'Windows'
    else if (/mac/i.test(ua)) platform.value = 'macOS'
    else if (/linux/i.test(ua)) platform.value = 'Linux'
    else platform.value = 'Unknown'
  }
  
  // Try to detect Tauri by calling getVersion
  try {
    const ver = await getVersion()
    if (ver) {
      hasTauri.value = true
      version.value = ver
    }
  } catch (err) {
    error.value = `Tauri not detected: ${err.message || err}`
  }
  
  // Simulate update check
  if (!isDev.value && hasTauri.value && ['Windows', 'macOS', 'Linux'].includes(platform.value)) {
    updateStatus.value = 'checking...'
    try {
      const response = await fetch('https://api.github.com/repos/Volminoduro/wakfarm/releases/latest')
      if (response.ok) {
        const data = await response.json()
        latestVersion.value = data.tag_name?.replace(/^v/, '') || 'unknown'
        
        // Check if assets match current platform
        if (Array.isArray(data.assets)) {
          const hasWindowsSuffix = data.assets.some(a => a.name?.includes('-windows'))
          const hasMacOSSuffix = data.assets.some(a => a.name?.includes('-macos'))
          const hasLinuxSuffix = data.assets.some(a => a.name?.includes('-linux'))
          
          if (!hasWindowsSuffix && !hasMacOSSuffix && !hasLinuxSuffix) {
            updateStatus.value = 'old format (upgrading)'
          } else {
            updateStatus.value = 'checked'
          }
        } else {
          updateStatus.value = 'checked'
        }
      } else {
        updateStatus.value = `failed: ${response.status}`
      }
    } catch (err) {
      updateStatus.value = `error: ${err.message}`
    }
  } else {
    if (isDev.value) updateStatus.value = 'disabled (DEV)'
    else if (!hasTauri.value) updateStatus.value = 'disabled (no Tauri)'
    else updateStatus.value = 'disabled (unknown platform)'
  }
})
</script>
