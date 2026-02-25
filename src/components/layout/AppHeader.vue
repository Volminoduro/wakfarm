<template>
  <header ref="appHeaderRef" class="sticky top-0 left-0 right-0 shadow-xl z-40 cf-header">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-2 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <h1 class="text-4xl font-bold cf-title-header" style="text-shadow: 0.125rem 0.125rem 0.25rem rgba(0,0,0,0.5);">WAKFARM</h1>
        
        <!-- Alerts handled by HeaderAlerts component -->
        <HeaderAlerts />

        <div class="ml-2 flex items-center gap-1">
          <div class="relative menu-group">
            <button
              @click="goDungeonsPrimary"
              :class="menuButtonClasses(isDungeonsActive)"
            >
              <span>{{ $t('divers.nav_dungeons_rifts') }}</span>
              <span class="text-xs">▾</span>
            </button>
            <div class="menu-dropdown">
              <button class="menu-item" @click="selectDungeons('rentability')">{{ $t('divers.tab_rentability') }}</button>
              <div class="menu-item-has-children">
                <button class="menu-item menu-item-split" @click="selectDungeons('runs')">
                  <span>{{ $t('divers.tab_runs') }}</span>
                  <span class="text-xs">▸</span>
                </button>
                <div class="menu-submenu">
                  <button class="menu-item" @click="selectDungeonsHourly('time')">{{ kamasMinutesRunsLabel }}</button>
                  <button class="menu-item" @click="selectDungeonsHourly('config')">{{ $t('divers.runs_config') }}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="relative menu-group">
            <button
              @click="goHarvestPrimary"
              :class="menuButtonClasses(mainTab === 'harvest')"
            >
              <span>{{ $t('divers.harvest_jobs_hour_tab') }}</span>
              <span class="text-xs">▾</span>
            </button>
            <div class="menu-dropdown">
              <button class="menu-item" @click="selectHarvest('time')">{{ kamasMinutesHarvestLabel }}</button>
              <button class="menu-item" @click="selectHarvest('harvest')">{{ $t('divers.nav_configuration') }}</button>
            </div>
          </div>

          <div class="relative menu-group">
            <button
              @click="goCraftPrimary"
              :class="menuButtonClasses(mainTab === 'craft')"
            >
              <span>{{ $t('divers.craft_jobs_tab') }}</span>
              <span class="text-xs">▾</span>
            </button>
            <div class="menu-dropdown">
              <button class="menu-item" @click="selectCraft('kamas')">{{ $t('divers.tab_craft_kamas') }}</button>
              <button class="menu-item" @click="selectCraft('jobs')">{{ $t('divers.nav_configuration') }}</button>
            </div>
          </div>

          <div class="relative menu-group">
            <button
              @click="goPricesPrimary"
              :class="menuButtonClasses(mainTab === 'prices')"
            >
              <span>{{ $t('divers.tab_prices') }}</span>
              <span class="text-xs">▾</span>
            </button>
            <div class="menu-dropdown">
              <button class="menu-item" @click="selectPrices('collective')">{{ $t('divers.prices_tab_collective') }}</button>
              <button class="menu-item" @click="selectPrices('personal')">{{ $t('divers.prices_tab_personal') }}</button>
            </div>
          </div>

          <button
            @click="mainTab = 'settings'"
            :class="menuButtonClasses(mainTab === 'settings')"
          >
            {{ $t('divers.tab_settings') }}
          </button>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <DisplayToggle />
        <LanguageSelector />
      </div>
    </div>
    
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import HeaderAlerts from '@/components/HeaderAlerts.vue'
import DisplayToggle from '@/components/DetailedToggle.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const mainTab = useLocalStorage(LS_KEYS.MAIN_TAB, 'rentability')
const runsSubTab = useLocalStorage(LS_KEYS.RUNS_SUBTAB, 'time')
const craftSubTab = useLocalStorage(LS_KEYS.CRAFT_SUBTAB, 'kamas')
const pricesSubTab = useLocalStorage(LS_KEYS.PRICES_ACTIVE_TAB, 'personal')
const timePeriodRuns = useLocalStorage(LS_KEYS.TIME_PERIOD, 60)
const timePeriodHarvest = useLocalStorage(LS_KEYS.HARVEST_TIME_PERIOD, 60)
// Alerts are delegated to `HeaderAlerts` component

const isDungeonsActive = computed(() => ['rentability', 'runs'].includes(mainTab.value))

function formatMinutesLabel(rawValue) {
  const base = String(t('divers.nav_kamas_minutes') || 'Kamas / xx mins')
  const parsed = Number(rawValue)
  const safeMinutes = Number.isFinite(parsed) ? Math.max(0, parsed) : 60
  return base.replace('xx', String(safeMinutes))
}

const kamasMinutesRunsLabel = computed(() => {
  return formatMinutesLabel(timePeriodRuns.value)
})

const kamasMinutesHarvestLabel = computed(() => {
  return formatMinutesLabel(timePeriodHarvest.value)
})

function menuButtonClasses(active) {
  return [
    'px-3 py-1 transition-all border-b-2 text-sm font-semibold flex items-center gap-2',
    active
      ? 'text-white border-current'
      : 'text-white/80 border-transparent opacity-85 hover:opacity-100 hover:text-white'
  ]
}

function goDungeonsPrimary() {
  selectDungeons('rentability')
}

function goHarvestPrimary() {
  selectHarvest('time')
}

function goCraftPrimary() {
  selectCraft('kamas')
}

function goPricesPrimary() {
  selectPrices('collective')
}

function selectDungeons(tab) {
  mainTab.value = tab
  if (tab === 'runs') runsSubTab.value = 'time'
}

function selectHarvest(tab) {
  mainTab.value = 'harvest'
  runsSubTab.value = tab
}

function selectDungeonsHourly(tab) {
  mainTab.value = 'runs'
  runsSubTab.value = tab
}

function selectCraft(tab) {
  mainTab.value = 'craft'
  craftSubTab.value = tab
}

function selectPrices(tab) {
  mainTab.value = 'prices'
  pricesSubTab.value = tab
}

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

<style scoped>
.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 14rem;
  z-index: 60;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  overflow: visible;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(4px);
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.menu-group:hover > .menu-dropdown {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 0.6rem 0.8rem;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: background-color 0.15s ease;
}

.menu-item:hover {
  background: var(--color-bg-primary);
}

.menu-item-has-children {
  position: relative;
}

.menu-item-split {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  min-width: 14rem;
  z-index: 70;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(4px);
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.menu-item-has-children:hover > .menu-submenu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(0);
}
</style>
