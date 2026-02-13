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
import { useI18n } from 'vue-i18n'
import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { confirm, message } from '@tauri-apps/plugin-dialog'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useDevToolsStore } from '@/stores/useDevToolsStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
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
const { t } = useI18n()

// Tab state with localStorage persistence (shared ref)
const mainTab = useLocalStorage(LS_KEYS.MAIN_TAB, 'rentability')
const minimizeToTray = useLocalStorage(LS_KEYS.SETTINGS_MINIMIZE_TO_TRAY, false)

const UPDATE_REPO = 'Volminoduro/wakfarm'

function isNewerVersion(latest, current) {
  const latestParts = String(latest).split('.').map(Number)
  const currentParts = String(current).split('.').map(Number)
  const len = Math.max(latestParts.length, currentParts.length)
  for (let i = 0; i < len; i += 1) {
    const a = Number.isFinite(latestParts[i]) ? latestParts[i] : 0
    const b = Number.isFinite(currentParts[i]) ? currentParts[i] : 0
    if (a > b) return true
    if (a < b) return false
  }
  return false
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent || ''
  if (/windows/i.test(ua)) return 'windows'
  if (/mac/i.test(ua)) return 'macos'
  if (/linux/i.test(ua)) return 'linux'
  return null
}

function getAssetForPlatform(assets, platform) {
  if (!Array.isArray(assets)) return null
  
  switch (platform) {
    case 'windows':
      // Cherche .exe avec ou sans prefix
      return assets.find(asset => 
        typeof asset.name === 'string' && asset.name.toLowerCase().includes('.exe')
      )
    case 'macos':
      // Cherche .app.tar.gz ou .app.zip
      return assets.find(asset => 
        typeof asset.name === 'string' && (
          asset.name.toLowerCase().endsWith('.app.tar.gz') ||
          asset.name.toLowerCase().endsWith('.app.zip') ||
          asset.name.toLowerCase().includes('.app.')
        )
      )
    case 'linux':
      // Cherche executable nommé wakfarm ou avec suffix -linux
      return assets.find(asset => 
        typeof asset.name === 'string' && (
          asset.name.toLowerCase() === 'wakfarm' ||
          asset.name.toLowerCase().includes('-linux')
        ) &&
        !asset.name.includes('.')
      )
    default:
      return null
  }
}

async function checkForUpdates() {
  console.log('[Update] Starting update check, DEV mode:', import.meta.env.DEV)
  if (import.meta.env.DEV) {
    console.log('[Update] Skipped: DEV mode enabled')
    return
  }
  
  const platform = detectPlatform()
  console.log('[Update] Detected platform:', platform)
  if (!platform) {
    console.log('[Update] Skipped: unknown platform')
    return
  }

  try {
    const currentVersion = await getVersion()
    console.log('[Update] Current version:', currentVersion)
    
    const response = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    })

    console.log('[Update] GitHub API response:', response.status)
    if (!response.ok) {
      console.log('[Update] Skipped: API error')
      return
    }

    const data = await response.json()
    const latestTag = typeof data.tag_name === 'string' ? data.tag_name.replace(/^v/, '') : ''
    console.log('[Update] Latest tag:', latestTag)
    
    if (!latestTag || !isNewerVersion(latestTag, currentVersion)) {
      console.log('[Update] Skipped: no newer version available')
      return
    }

    const asset = getAssetForPlatform(data.assets, platform)
    console.log('[Update] Asset found:', asset?.name, 'URL:', asset?.browser_download_url)
    
    if (!asset?.browser_download_url) {
      console.log('[Update] Skipped: no asset found for platform')
      return
    }

    console.log('[Update] Showing update dialog...')
    const ok = await confirm(t('divers.update.message', { version: latestTag }), {
      title: t('divers.update.title'),
      kind: 'info'
    })
    console.log('[Update] User choice:', ok)
    
    if (!ok) return

    try {
      console.log('[Update] Installing update...')
      // Only Windows supports auto-update for now
      if (platform === 'windows') {
        await invoke('install_update', { downloadUrl: asset.browser_download_url })
        console.log('[Update] Update started, app will restart automatically')
      } else {
        await message(t('divers.update.manualDownload', { url: asset.browser_download_url }), {
          title: t('divers.update.title'),
          kind: 'info'
        })
      }
      console.log('[Update] Update completed')
    } catch (error) {
      console.error('[Update] Install error:', error)
      await message(t('divers.update.failed', { error: error?.message || error }), {
        title: t('divers.update.title'),
        kind: 'error'
      })
    }
  } catch (error) {
    console.error('[Update] Check failed:', error)
  }
}

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
