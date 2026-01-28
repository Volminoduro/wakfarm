<template>
  <div class="cf-panel-lg p-2 overflow-visible">
    <div class="mb-2">
      <h2 class="text-2xl cf-text-light">Filtres</h2>
    </div>

    <div>
        <table class="w-full" style="table-layout: fixed;">
          <thead>
            <tr>
              <th class="text-center font-medium pb-2 text-base cf-text-normal">{{ $t('divers.config_min_rate') }}</th>
              <th class="text-center font-medium pb-2 text-base cf-text-normal">{{ $t('divers.config_min_profit') }}</th>
              <th class="text-center font-medium pb-2 text-base cf-text-normal">{{ $t('divers.config_min_total') }}</th>
              <th class="text-center font-medium pb-2 text-base cf-text-normal">{{ $t('divers.level_ranges_title') }}</th>
              <th class="text-center font-medium pb-2 text-base cf-text-normal" colspan="2">{{ $t('divers.config_server') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">
                <div class="input-wrapper w-17.5 mx-auto">
                  <input
                    type="text"
                    :value="formatRateInput(store.config.minDropRatePercent)"
                    @input="updateMinDropRate"
                    class="cf-input rounded px-2 py-1 rate-input-padding w-17.5"
                  />
                  <span class="rate-icon">%</span>
                </div>
              </td>
              <td class="text-center">
                <div class="input-wrapper w-35 mx-auto">
                  <input
                    type="text"
                    :value="formatInputNumber(store.config.minItemProfit)"
                    @input="updateMinItemProfit"
                    class="cf-input rounded px-2 py-1 kamas-input-padding w-35"
                  />
                  <span class="kamas-icon">₭</span>
                </div>
              </td>
              <td class="text-center">
                <div class="input-wrapper w-35 mx-auto">
                  <input
                    type="text"
                    :value="formatInputNumber(store.config.minInstanceTotal)"
                    @input="updateMinInstanceTotal"
                    class="cf-input rounded px-2 py-1 kamas-input-padding w-35"
                  />
                  <span class="kamas-icon">₭</span>
                </div>
              </td>
              <td class="text-center">
                <div class="w-40 mx-auto">
                  <LevelRangeFilter />
                </div>
              </td>
              <td colspan="2" class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <select 
                    id="server"
                    v-model="store.config.server"
                    class="cf-select w-40"
                  >
                    <option v-for="server in jsonStore.servers" :key="server.id" :value="server.id">
                      {{ $t("divers." + server.name_key) }}
                    </option>
                  </select>
                </div>
              </td>
            </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/useAppStore'
import { formatInputNumber, formatRateInput, parseFormattedNumber } from '@/utils/formatters'
import LevelRangeFilter from './LevelRangeFilter.vue'
import { useJsonStore } from '@/stores/useJsonStore'

const store = useAppStore()
const jsonStore = useJsonStore()

// Generic numeric field updater
const updateNumericField = (event, fieldName, parser = parseInt) => {
  const value = parseFormattedNumber(event.target.value)
  store.config[fieldName] = value === '' ? null : parser(value, 10) || null
}

// Specific field updaters
const updateMinItemProfit = (e) => updateNumericField(e, 'minItemProfit')
const updateMinInstanceTotal = (e) => updateNumericField(e, 'minInstanceTotal')

// Drop rate updater with percentage constraints
function updateMinDropRate(event) {
  const value = event.target.value.replace(',', '.').trim()
  
  if (value === '') {
    store.config.minDropRatePercent = null
    return
  }
  
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue)) {
    store.config.minDropRatePercent = null
    return
  }
  
  const clampedValue = Math.max(0, Math.min(100, parsedValue))
  store.config.minDropRatePercent = clampedValue
  
  // Update input if value was clamped
  if (parsedValue !== clampedValue) {
    event.target.value = clampedValue.toString()
  }
}
</script>

<style scoped>
input[type=number] {
  appearance: textfield;
}

.input-wrapper {
  position: relative;
  display: block;
  width: 100%;
}

.kamas-input-padding {
  padding-right: 2.5rem !important;
}

.rate-input-padding {
  padding-right: 2rem !important;
}

.kamas-icon,
.rate-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  margin-top: -0.5em;
  color: #9CA3AF;
  pointer-events: none;
  font-weight: 500;
  line-height: 1;
}

/* custom checkbox styles moved to global src/style.css */

/* Smooth expand/collapse transition with GPU acceleration */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top;
  will-change: opacity, transform;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: scaleY(1);
}
</style>