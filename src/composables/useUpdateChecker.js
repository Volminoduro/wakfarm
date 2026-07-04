import { useI18n } from 'vue-i18n'
import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { isRunningInTauri } from '@/utils/machineId'
import { confirm, message } from '@tauri-apps/plugin-dialog'

const UPDATE_CACHE_KEY = 'update:cache'
const DEFAULT_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000

function readCache() {
  try {
    const raw = localStorage.getItem(UPDATE_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(next) {
  try {
    localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify(next))
  } catch {
    // ignore cache write errors
  }
}

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
      return assets.find(asset =>
        typeof asset.name === 'string' && asset.name.toLowerCase().includes('.exe')
      )
    case 'macos':
      return assets.find(asset =>
        typeof asset.name === 'string' && (
          asset.name.toLowerCase().endsWith('.app.tar.gz') ||
          asset.name.toLowerCase().endsWith('.app.zip') ||
          asset.name.toLowerCase().includes('.app.')
        )
      )
    case 'linux':
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

export function useUpdateChecker({ repo, minIntervalMs = DEFAULT_MIN_INTERVAL_MS } = {}) {
  const { t } = useI18n()

  async function checkForUpdates() {
    if (import.meta.env.DEV) return

    const platform = detectPlatform()
    if (!platform) return

    if (!isRunningInTauri()) return

    const cache = readCache()
    const now = Date.now()
    if (cache.lastCheckedAt && now - cache.lastCheckedAt < minIntervalMs) return

    try {
      const currentVersion = await getVersion()

      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' }
      })

      if (!response.ok) {
        writeCache({ ...cache, lastCheckedAt: now })
        return
      }

      const data = await response.json()
      const latestTag = typeof data.tag_name === 'string' ? data.tag_name.replace(/^v/, '') : ''

      writeCache({ ...cache, lastCheckedAt: now })

      if (!latestTag || !isNewerVersion(latestTag, currentVersion)) return
      if (cache.lastPromptedVersion === latestTag) return

      const asset = getAssetForPlatform(data.assets, platform)
      if (!asset?.browser_download_url) return

      const ok = await confirm(t('divers.update.message', { version: latestTag }), {
        title: t('divers.update.title'),
        kind: 'info'
      })

      writeCache({ ...cache, lastPromptedVersion: latestTag, lastCheckedAt: now })

      if (!ok) return

      try {
        if (platform === 'windows') {
          await invoke('install_update', { downloadUrl: asset.browser_download_url })
        } else {
          await message(t('divers.update.manualDownload', { url: asset.browser_download_url }), {
            title: t('divers.update.title'),
            kind: 'info'
          })
        }
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

  return { checkForUpdates }
}
