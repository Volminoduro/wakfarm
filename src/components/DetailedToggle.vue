<template>
  <button
    @click="toggle"
    class="px-3 py-1 rounded-md border transition-all duration-150 ease-out flex items-center gap-2 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    :class="buttonClasses"
  >
    <span v-if="detailed" class="text-sm font-medium">{{ $t('divers.display_detailed') }}</span>
    <span v-else class="text-sm font-medium">{{ $t('divers.display_simple') }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'

const detailed = useLocalStorage(LS_KEYS.DETAILED_VIEW, false)

function toggle() {
  detailed.value = !detailed.value
}

const buttonClasses = computed(() => {
  return detailed.value
    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-sm hover:-translate-y-[1px]'
    : 'bg-transparent border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white hover:shadow-sm hover:-translate-y-[1px]'
})
</script>

<style scoped>
.text-white-70 { color: rgba(255,255,255,0.7); }
</style>
