<template>
  <img
    v-if="jobId && jobId > 0"
    :src="jobIconUrl"
    :alt="'Job icon'"
    class="object-contain shrink-0"
    :style="iconStyle"
    @error="$event.target.style.display='none'"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  jobId: {
    type: [Number, String],
    required: false,
    default: null
  },
  size: {
    type: Number,
    default: 32
  }
})

const jobIconUrl = computed(() => {
  if (props.jobId === null || props.jobId === undefined) return ''
  try {
    return new URL(`../assets/job/${props.jobId}.png`, import.meta.url).href
  } catch {
    return ''
  }
})

const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  maxHeight: `${props.size}px`
}))
</script>
