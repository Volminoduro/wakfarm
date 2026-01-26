<template>
  <header ref="appHeaderRef" class="sticky top-0 left-0 right-0 shadow-xl z-40 cf-header">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-2 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <h1 class="text-4xl font-bold cf-title-header" style="text-shadow: 0.125rem 0.125rem 0.25rem rgba(0,0,0,0.5);">WAKFARM</h1>
        
        <!-- Alerts handled by HeaderAlerts component -->
        <HeaderAlerts />
      </div>
      
      <div class="flex items-center gap-3">
        <DisplayToggle />
        <LanguageSelector />
      </div>
    </div>
    
    <FloatingFilter />
    
    <!-- Main Navigation Tabs -->
    <nav class="flex items-center">
      <button 
        @click="mainTab = 'rentability'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', 'cf-tab-separator', mainTab === 'rentability' ? 'cf-tab-active' : 'cf-tab-inactive']"
        :style="`border-right-color: var(--color-tab-separator) !important; ${mainTab === 'rentability' ? 'text-shadow: var(--active-tab-text-shadow);' : ''}`">
        {{ $t('divers.tab_rentability') }}
      </button>
      <button 
        @click="mainTab = 'runs'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', 'cf-tab-separator', mainTab === 'runs' ? 'cf-tab-active' : 'cf-tab-inactive']"
        :style="`border-right-color: var(--color-tab-separator) !important; ${mainTab === 'runs' ? 'text-shadow: var(--active-tab-text-shadow);' : ''}`">
        {{ $t('divers.tab_runs') }}
      </button>
      <button 
        @click="mainTab = 'prices'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'prices' ? 'cf-tab-active' : 'cf-tab-inactive']"
        :style="mainTab === 'prices' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
        {{ $t('divers.tab_prices') }}
      </button>
      <button 
        @click="mainTab = 'settings'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'settings' ? 'cf-tab-active' : 'cf-tab-inactive']"
        :style="mainTab === 'settings' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
        {{ $t('divers.tab_settings') }}
      </button>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import FloatingFilter from '@/components/FloatingFilter.vue'
import HeaderAlerts from '@/components/HeaderAlerts.vue'
import DisplayToggle from '@/components/DetailedToggle.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'

const mainTab = useLocalStorage(LS_KEYS.MAIN_TAB, 'rentability')
// Alerts are delegated to `HeaderAlerts` component

// Expose header height as a CSS variable so other views can stick just below it
const appHeaderRef = ref(null)
function updateHeaderHeight() {
  const h = appHeaderRef.value?.offsetHeight || 0
  document.documentElement.style.setProperty('--app-header-height', `${h}px`)
}

onMounted(() => {
  updateHeaderHeight()
  window.addEventListener('resize', updateHeaderHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHeaderHeight)
})
</script>
