<template>
  <div class="overflow-hidden" style="contain: layout style paint;">
    <ul class="divide-y divide-white/20 bg-secondary">
      <li
        v-for="(pick, pickIndex) in displayedPicks"
        :key="`${pick.itemId}-${pickIndex}`"
        class="px-5 py-2 flex justify-between items-center"
      >
        <div class="flex items-center gap-3">
          <div :class="pick.isEligible === false ? 'text-slate-500' : 'text-slate-200'">
            <span :class="['font-bold', getRarityClass(pick.rarity), pick.isEligible === false ? 'opacity-60' : '']">
              {{ getItemName(pick.itemId) }}
            </span>
            <template v-if="showQuantityDetails && detailedView">
              <span> x{{ formatExpectedCount(pick) }} ({{ formatDropRate(pick.dropRate) }})</span>
            </template>
          </div>
        </div>
        <div :class="pick.isEligible === false ? 'font-semibold text-slate-500' : 'font-semibold text-kamas'">
          {{ formatNumber(pick.totalKamas) }} ₭
        </div>
      </li>
    </ul>
    <div v-if="hasMorePicks" class="px-5 py-3 text-center bg-secondary">
      <button
        @click.stop="toggleShowAll"
        class="text-sm font-medium transition-colors hover:underline text-slate-100"
      >
        {{ showAllPicks ? `Voir moins (${INITIAL_PICKS_SHOWN} items)` : `Voir tout (${picks.length} items)` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatNumber } from '@/utils/formatters'
import { getRarityClass } from '@/utils/itemHelpers'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  picks: {
    type: Array,
    default: () => []
  },
  showQuantityDetails: {
    type: Boolean,
    default: true
  },
  detailedView: {
    type: Boolean,
    default: false
  }
})

const INITIAL_PICKS_SHOWN = 15
const showAllPicks = ref(false)

const displayedPicks = computed(() => {
  if (!props.picks) return []
  if (showAllPicks.value || props.picks.length <= INITIAL_PICKS_SHOWN) {
    return props.picks
  }
  return props.picks.slice(0, INITIAL_PICKS_SHOWN)
})

const hasMorePicks = computed(() => {
  return props.picks && props.picks.length > INITIAL_PICKS_SHOWN
})

const toggleShowAll = () => {
  showAllPicks.value = !showAllPicks.value
}

function getItemName(itemId) {
  return t(`items.${itemId}`) || `Item ${itemId}`
}

function formatDropRate(rate) {
  if (rate === undefined || rate === null) return '100%'
  const percent = (rate * 100)
  return percent >= 100 ? '100%' : percent >= 10 ? `${percent.toFixed(0)}%` : `${percent.toFixed(1)}%`
}

function formatExpectedCount(pick) {
  if (pick?.expectedItems !== undefined && pick?.expectedItems !== null) {
    return formatExpectedValue(Number(pick.expectedItems) || 0)
  }

  const actionCount = Number(pick?.count) || 0
  const dropRate = Number(pick?.dropRate)
  if (!Number.isFinite(dropRate) || dropRate >= 0.99) {
    return actionCount
  }

  return formatExpectedValue(actionCount * dropRate)
}

function formatExpectedValue(value) {
  return value >= 10 ? Math.round(value) : value.toFixed(1)
}
</script>
