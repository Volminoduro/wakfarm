<template>
  <div v-if="visible" class="fixed bottom-20 right-4 bg-slate-800 text-white p-4 rounded shadow-lg text-xs max-w-md z-50 space-y-1 font-mono border border-slate-600">
    <div class="flex justify-between items-center mb-2">
      <span class="font-bold text-sm">Debug Info</span>
      <button @click="$emit('close')" class="text-slate-400 hover:text-white">✕</button>
    </div>
    <div><strong>Version:</strong> {{ version || 'N/A' }}</div>
    <div><strong>Platform:</strong> {{ platform }}</div>
    <div v-if="isDev">
      <div><strong>DEV mode:</strong> {{ isDev ? '✓' : '✗' }}</div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <strong class="whitespace-nowrap">Author UID:</strong>
      <span class="break-all">{{ authorUid || 'N/A' }}</span>
      <button
        v-if="authorUid"
        @click="copyAuthorUid"
        class="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[10px]"
      >
        {{ copyState }}
      </button>
    </div>
    <div><strong>Allowlist:</strong> {{ allowlistStatus }}</div>
    <div><strong>Blacklist read:</strong> {{ blacklistReadStatus }}</div>
    <div><strong>Blacklist write:</strong> {{ blacklistWriteStatus }}</div>
    <div v-if="error" class="text-red-400 mt-2 break-words"><strong>Error:</strong> {{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits, computed } from 'vue'
import { useCollectivePricesStore } from '@/stores/useCollectivePricesStore'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const version = ref(import.meta.env.VITE_APP_VERSION || '')
const platform = ref('')
const isDev = ref(import.meta.env.DEV)
const error = ref('')
const copyState = ref('copy')

const collectivePricesStore = useCollectivePricesStore()
const authorUid = computed(() => collectivePricesStore.machineID)
const allowlistStatus = computed(() => {
  if (!collectivePricesStore.allowlistChecked) return 'unknown'
  return collectivePricesStore.isAllowlisted ? 'allowed' : 'not allowed'
})

const blacklistReadStatus = computed(() => {
  if (!collectivePricesStore.blacklistChecked) return 'unknown'
  return collectivePricesStore.blacklistReadExists ? 'yes' : 'no'
})
const blacklistWriteStatus = computed(() => {
  if (!collectivePricesStore.blacklistChecked) return 'unknown'
  return collectivePricesStore.blacklistWriteExists ? 'yes' : 'no'
})

const copyAuthorUid = async () => {
  if (!authorUid.value || typeof navigator === 'undefined' || !navigator.clipboard) {
    copyState.value = 'unavailable'
    setTimeout(() => {
      copyState.value = 'copy'
    }, 1500)
    return
  }

  try {
    await navigator.clipboard.writeText(authorUid.value)
    copyState.value = 'copied'
  } catch (err) {
    copyState.value = 'failed'
  }

  setTimeout(() => {
    copyState.value = 'copy'
  }, 1500)
}

onMounted(async () => {
  // Check platform
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || ''
    if (/windows/i.test(ua)) platform.value = 'Windows'
    else if (/mac/i.test(ua)) platform.value = 'macOS'
    else if (/linux/i.test(ua)) platform.value = 'Linux'
    else platform.value = 'Unknown'
  }
})
</script>
