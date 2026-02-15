<template>
  <div class="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-md">
    <TransitionGroup name="toast">
      <div
        v-for="alert in visibleToasts"
        :key="alert.id"
        class="toast-alert shadow-2xl rounded-lg p-4 border-2 flex items-start gap-3 animate-slide-in"
        :class="toastClass(alert.type)"
      >
        <span class="text-2xl flex-shrink-0">
          {{ toastIcon(alert.type) }}
        </span>
        <div class="flex-1 text-white text-sm">
          {{ alert.rawMessage ? alert.rawMessage : alert.message }}
        </div>
        <button 
          @click="removeToast(alert.id)"
          class="text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '@/stores/useAlertsStore'

const { t } = useI18n()
const alertsStore = useAlertsStore()

// Only show temporary alerts (duration > 0) as toasts
const visibleToasts = computed(() => {
  return alertsStore.alerts
    .filter(alert => alert.isTemporary)
    .map(alert => ({
      ...alert,
      message: alert.rawMessage ? alert.rawMessage : t(`divers.${alert.messageKey}`, alert.params)
    }))
})

function removeToast(id) {
  alertsStore.removeAlert(id)
}

function toastClass(type) {
  if (type === 'danger') return 'bg-red-900/95 border-red-500'
  if (type === 'success') return 'bg-emerald-900/95 border-emerald-500'
  if (type === 'info') return 'bg-sky-900/95 border-sky-500'
  return 'bg-orange-900/95 border-orange-500'
}

function toastIcon(type) {
  if (type === 'danger') return '●'
  if (type === 'success') return '✓'
  if (type === 'info') return 'ℹ'
  return '▲'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
