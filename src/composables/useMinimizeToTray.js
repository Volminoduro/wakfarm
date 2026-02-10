import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function useMinimizeToTray() {
  const isMinimizedToTray = ref(false)
  const isLoading = ref(false)
  let unlistenResize = null

  const minimizeToTray = async () => {
    try {
      isLoading.value = true
      await invoke('hide_window')
      isMinimizedToTray.value = true
      return true
    } catch (error) {
      console.error('Error hiding window:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const showFromTray = async () => {
    try {
      isLoading.value = true
      await invoke('show_window')
      isMinimizedToTray.value = false
      return true
    } catch (error) {
      console.error('Error showing window:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const setupCloseToTray = async (minimizeToTrayEnabled) => {
    const window = getCurrentWindow()

    if (unlistenResize) {
      try {
        await unlistenResize()
      } catch (error) {
        console.warn('Error removing minimize listener:', error)
      }
      unlistenResize = null
    }

    if (!minimizeToTrayEnabled) {
      try {
        await invoke('set_minimize_to_tray_enabled', { enabled: false })
      } catch (error) {
        console.warn('Unable to set minimize-to-tray state:', error)
      }
      return false
    }

    try {
      await invoke('set_minimize_to_tray_enabled', { enabled: true })
    } catch (error) {
      console.warn('Unable to set minimize-to-tray state:', error)
    }

    unlistenResize = await window.onResized(async () => {
      try {
        const minimized = await window.isMinimized()
        if (minimized) {
          await invoke('hide_window')
          isMinimizedToTray.value = true
        }
      } catch (error) {
        console.error('Error handling minimize event:', error)
      }
    })

    return true
  }

  return {
    isMinimizedToTray,
    isLoading,
    minimizeToTray,
    showFromTray,
    setupCloseToTray
  }
}
