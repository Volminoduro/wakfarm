import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertsStore = defineStore('alerts', () => {
  // Alerts: { id, type ('warning'|'danger'), messageKey, params?, isTemporary }
  const alerts = ref([])
  let nextId = 0

  // Add alert with auto-removal after duration (0 = persistent)
  function addAlert(type, messageKey, params = {}, duration = 8000) {
    const id = nextId++
    const isTemporary = duration > 0
    
    alerts.value.push({ id, type, messageKey, params, isTemporary })
    
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }
    
    return id
  }

  // Add a raw text alert (not using i18n keys)
  function addRawAlert(type, rawMessage, duration = 8000) {
    const id = nextId++
    const isTemporary = duration > 0

    alerts.value.push({ id, type, rawMessage, params: {}, isTemporary })

    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }

    return id
  }

  // Remove alert by ID
  function removeAlert(id) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index > -1) {
      alerts.value.splice(index, 1)
    }
  }

  // Clear all alerts
  function clearAlerts() {
    alerts.value = []
  }

  return {
    alerts,
    addAlert,
    addRawAlert,
    removeAlert,
    clearAlerts
  }
})
