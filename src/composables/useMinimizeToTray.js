import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export function useMinimizeToTray() {
  const isMinimizedToTray = ref(false)
  const isLoading = ref(false)

  const minimizeToTray = async () => {
    try {
      isLoading.value = true
      await invoke('minimize_window')
      isMinimizedToTray.value = true
      return true
    } catch (error) {
      console.error('Error minimizing to tray:', error)
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
    // This setup will be enhanced later with proper Tauri window event handling
    // For now, just validate the setting
    return minimizeToTrayEnabled
  }

  return {
    isMinimizedToTray,
    isLoading,
    minimizeToTray,
    showFromTray,
    setupCloseToTray
  }
}
