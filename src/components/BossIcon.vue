<template>
  <img
    v-if="bossId && bossId > 0"
    :src="bossIconUrl"
    :alt="'Boss'"
    class="object-contain shrink-0 h-8 max-h-8"
    @error="$event.target.style.display='none'"
  />
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  bossId: {
    type: [Number, String],
    required: false,
    default: null
  },
  size: {
    type: Number,
    default: 32
  }
})
const bossIconUrl = computed(() => {
  if (props.bossId === null || props.bossId === undefined) return ''
  try {
    return new URL(`../assets/boss/${props.bossId}.png`, import.meta.url).href
  } catch {
    return ''
  }
});
</script>
