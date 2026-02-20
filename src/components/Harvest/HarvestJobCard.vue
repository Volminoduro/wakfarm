<template>
  <InstanceBaseCard
    :job-id="skillId"
    :title="cardTitle"
    :total-kamas="totalKamas"
    :is-expanded="isExpanded"
    :clickable="true"
    @toggle="toggleExpand"
  >
    <transition name="expand">
      <div v-if="isExpanded && picks && picks.length > 0" class="overflow-hidden" style="contain: layout style paint;">
        <ul class="divide-y divide-white/20 bg-secondary">
          <li v-for="pick in displayedPicks" :key="pick.itemId" class="px-5 py-2 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="text-slate-200">
                <span :class="['font-bold', getRarityClass(pick.rarity)]">{{ getItemName(pick.itemId) }}</span>
                <template v-if="detailedView">
                  <span> x{{ formatExpectedCount(pick) }} ({{ formatDropRate(pick.dropRate) }})</span>
                </template>
              </div>
            </div>
            <div class="font-semibold text-kamas">{{ formatNumber(pick.totalKamas) }} ₭</div>
          </li>
        </ul>
        <div v-if="hasMorePicks" class="px-5 py-3 text-center bg-secondary">
          <button 
            @click.stop="toggleShowAll"
            class="text-sm font-medium transition-colors hover:underline text-slate-100">
            {{ showAllPicks ? `Voir moins (${INITIAL_PICKS_SHOWN} items)` : `Voir tout (${picks.length} items)` }}
          </button>
        </div>
      </div>
    </transition>
  </InstanceBaseCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { formatNumber } from '@/utils/formatters'
import { getRarityClass } from '@/utils/itemHelpers'
import InstanceBaseCard from '@/components/Instance/InstanceBaseCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  skillId: {
    type: Number,
    required: true
  },
  jobLabel: {
    type: String,
    required: true
  },
  jobLevel: {
    type: Number,
    default: 100
  },
  totalKamas: {
    type: Number,
    required: true
  },
  kamasPerHour: {
    type: Number,
    required: true
  },
  usedSeconds: {
    type: Number,
    required: true
  },
  unusedSeconds: {
    type: Number,
    required: true
  },
  picks: {
    type: Array,
    default: () => []
  }
})

const INITIAL_PICKS_SHOWN = 15
const showAllPicks = ref(false)

// Expanded state management
const expandedHourJobs = useLocalStorage(LS_KEYS.EXPANDED_HOUR_JOBS, [])

const isExpanded = computed(() => {
  return expandedHourJobs.value.includes(props.skillId)
})

function toggleExpand() {
  const idx = expandedHourJobs.value.indexOf(props.skillId)
  if (idx > -1) {
    expandedHourJobs.value = expandedHourJobs.value.filter(id => id !== props.skillId)
  } else {
    expandedHourJobs.value = [...expandedHourJobs.value, props.skillId]
  }
}

const detailedView = useLocalStorage(LS_KEYS.DETAILED_VIEW, false)

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

const cardTitle = computed(() => {
  const levelText = t('divers.niveau_reduit') || 'Niv.'
  return `${props.jobLabel} ${levelText} ${props.jobLevel}`
})

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

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
