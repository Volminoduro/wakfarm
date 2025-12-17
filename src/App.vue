<template>
  <div class="min-h-screen flex flex-col bg-slate-900">

    <AppHeader />
    
    <main class="grow">
      <div v-if="!jsonStore.loaded" class="p-8 text-center">
        <p class="text-lg text-orange-400">{{$t('divers.loading')}}</p>
      </div>

      <RentabilityRunView v-if="mainTab === 'rentability'" />

      <RentabilityHourView v-else-if="mainTab === 'runs'" />

      <PricesView v-else-if="mainTab === 'prices'" />

      <SettingsView v-else-if="mainTab === 'settings'" />
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RentabilityRunView from '@/views/RentabilityRunView.vue'
import RentabilityHourView from '@/views/RentabilityHourView.vue'
import PricesView from '@/views/PricesView.vue'
import SettingsView from '@/views/SettingsView.vue'

const appStore = useAppStore()
const jsonStore = useJsonStore()

// Tab state with localStorage persistence (shared ref)
const mainTab = useLocalStorage(LS_KEYS.MAIN_TAB, 'rentability')

// Charger les données au montage
onMounted(async () => {
  await appStore.initData(appStore.config.server)
})

</script>
