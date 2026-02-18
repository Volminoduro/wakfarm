<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="cf-select w-full text-left flex items-center justify-between min-w-40"
      type="button">
      <span class="font-mono">{{ getDisplayText() }}</span>
      <svg 
        :class="['w-4 h-4 transition-transform', isOpen ? 'rotate-180' : '']"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <div 
      v-if="isOpen"
      class="absolute z-50 mt-1 w-full rounded shadow-lg cf-card overflow-visible">
      <div class="p-2">
        <button 
          @click="toggleAll"
          class="w-full text-sm px-2 py-1 rounded mb-2 cf-button-toggle">
          {{ store.config.levelRanges.length === LEVEL_RANGES.length ? $t('divers.level_ranges_toggle_none') : $t('divers.level_ranges_toggle_all') }}
        </button>
        <div class="space-y-1">
            <label
            v-for="(range, index) in LEVEL_RANGES"
            :key="index"
            class="cf-dropdown-item">
            <input
              type="checkbox"
              :checked="isRangeActive(index)"
              @change="toggleRange(index)"
              class="custom-checkbox-small"
            />
            <span class="text-slate-200">{{ range.label }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { LEVEL_RANGES } from '@/constants'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const store = useAppStore()
const isOpen = ref(false)
const dropdownRef = ref(null)

// Fermer le dropdown quand on clique en dehors
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleRange = (index) => {
  const ranges = [...store.config.levelRanges]
  const idx = ranges.indexOf(index)
  
  if (idx > -1) {
    ranges.splice(idx, 1)
  } else {
    ranges.push(index)
    ranges.sort((a, b) => a - b)
  }
  
  store.config.levelRanges = ranges
}

const isRangeActive = (index) => {
  return store.config.levelRanges.includes(index)
}

const toggleAll = () => {
  if (store.config.levelRanges.length === LEVEL_RANGES.length) {
    // Tout décocher
    store.config.levelRanges = []
  } else {
    // Tout cocher
    store.config.levelRanges = LEVEL_RANGES.map((_, i) => i)
  }
  // Fermer le menu après l'action
  isOpen.value = false
}

const getDisplayText = () => {
  const count = store.config.levelRanges.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === LEVEL_RANGES.length) return t('divers.level_ranges_all')
  // Format fixe pour éviter le changement de largeur
  return `${count.toString().padStart(2, ' ')}/${LEVEL_RANGES.length}`
}
</script>