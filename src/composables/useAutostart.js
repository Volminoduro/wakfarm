import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export function useAutostart() {
  const isAutostartEnabled = ref(false)
  const isLoading = ref(false)

  const checkAutostartStatus = async () => {
    try {
      isLoading.value = true
      const enabled = await invoke('is_autostart_enabled')
      isAutostartEnabled.value = enabled
      return enabled
    } catch (error) {
      console.error('Error checking autostart status:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const enableAutostart = async () => {
    try {
      isLoading.value = true
      await invoke('enable_autostart')
      isAutostartEnabled.value = true
      return true
    } catch (error) {
      console.error('Error enabling autostart:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const disableAutostart = async () => {
    try {
      isLoading.value = true
      await invoke('disable_autostart')
      isAutostartEnabled.value = false
      return true
    } catch (error) {
      console.error('Error disabling autostart:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const toggleAutostart = async () => {
    if (isAutostartEnabled.value) {
      return await disableAutostart()
    } else {
      return await enableAutostart()
    }
  }

  onMounted(() => {
    checkAutostartStatus()
  })

  return {
    isAutostartEnabled,
    isLoading,
    checkAutostartStatus,
    enableAutostart,
    disableAutostart,
    toggleAutostart
  }
}
