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
      <div v-if="isExpanded && picks && picks.length > 0">
        <ProfitPickList
          :picks="picks"
          :show-quantity-details="showQuantityDetails"
          :detailed-view="detailedView"
        />
      </div>
    </transition>
  </InstanceBaseCard>
</template>

<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import InstanceBaseCard from '@/components/Instance/InstanceBaseCard.vue'
import ProfitPickList from '@/components/ProfitPickList.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  showQuantityDetails: {
    type: Boolean,
    default: true
  },
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
  },
  expandedStorageKey: {
    type: String,
    default: LS_KEYS.EXPANDED_HOUR_JOBS
  }
})

// Expanded state management
const expandedHourJobs = useLocalStorage(props.expandedStorageKey, [])

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

const cardTitle = computed(() => {
  const levelText = t('divers.niveau_reduit') || 'Niv.'
  return `${props.jobLabel} ${levelText} ${props.jobLevel}`
})

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
