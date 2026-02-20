<template>
  <div class="cf-card">
    <div
      @click="clickable !== false ? emit('toggle') : undefined"
      :class="['px-5 py-4 flex items-center justify-between gap-4', clickable !== false ? 'cursor-pointer' : '']"
    >
      <div class="flex items-center gap-3 truncate">
        <BossIcon v-if="bossId" :boss-id="bossId" />
        <JobIcon v-else-if="jobId" :job-id="jobId" />
        <div class="font-bold text-sm truncate text-slate-100">{{ title }}</div>
      </div>
      <div class="flex items-center gap-4 shrink-0">
        <div class="font-bold text-lg whitespace-nowrap text-kamas">{{ formatNumber(totalKamas) }} ₭</div>
        <ExpandArrow v-if="typeof isExpanded === 'boolean'" :isExpanded="isExpanded" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup>
import BossIcon from '@/components/BossIcon.vue'
import JobIcon from '@/components/JobIcon.vue'
import ExpandArrow from '@/components/ExpandArrow.vue'
import { formatNumber } from '@/utils/formatters'

const props = defineProps({
  bossId: [Number, String],
  jobId: [Number, String],
  title: String,
  totalKamas: Number,
  isExpanded: Boolean,
  clickable: Boolean,
})
const emit = defineEmits(['toggle'])
</script>
