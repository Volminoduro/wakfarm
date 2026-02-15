import { useAlertsStore } from '@/stores/useAlertsStore'

export function useToast() {
  const alerts = useAlertsStore()

  function success(messageKeyOrRaw, params = {}, duration = 4000, raw = false) {
    if (raw) return alerts.addRawAlert('success', messageKeyOrRaw, duration)
    return alerts.addAlert('success', messageKeyOrRaw, params, duration)
  }

  function info(messageKeyOrRaw, params = {}, duration = 4000, raw = false) {
    if (raw) return alerts.addRawAlert('info', messageKeyOrRaw, duration)
    return alerts.addAlert('info', messageKeyOrRaw, params, duration)
  }

  function warn(messageKeyOrRaw, params = {}, duration = 5000, raw = false) {
    if (raw) return alerts.addRawAlert('warning', messageKeyOrRaw, duration)
    return alerts.addAlert('warning', messageKeyOrRaw, params, duration)
  }

  function danger(messageKeyOrRaw, params = {}, duration = 8000, raw = false) {
    if (raw) return alerts.addRawAlert('danger', messageKeyOrRaw, duration)
    return alerts.addAlert('danger', messageKeyOrRaw, params, duration)
  }

  // convenience raw alert
  function raw(message, type = 'warning', duration = 4000) {
    return alerts.addRawAlert(type, message, duration)
  }

  return {
    success,
    info,
    warn,
    danger,
    raw
  }
}
