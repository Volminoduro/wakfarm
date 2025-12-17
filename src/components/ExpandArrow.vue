<template>
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    :class="[isExpanded ? 'rotate-down' : '', 'transition-transform', 'text-slate-100']">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
  </svg>
</template>

<script setup>
defineProps({
  isExpanded: {
    type: Boolean,
    default: false
  }
})
</script>
