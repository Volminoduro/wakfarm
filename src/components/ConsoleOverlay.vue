<template>
  <div v-if="visible" class="fixed inset-0 bg-black/80 flex flex-col z-[9999]">
    <div class="flex justify-between items-center bg-slate-900 p-3 border-b border-slate-700">
      <span class="font-bold text-white">Console</span>
      <button @click="$emit('close')" class="text-slate-400 hover:text-white">✕</button>
    </div>
    
    <div class="flex-1 overflow-y-auto bg-slate-950 p-3 font-mono text-sm">
      <div 
        v-for="(line, idx) in logs" 
        :key="idx"
        :class="['mb-1', lineColor(line.type)]"
      >
        <span class="opacity-50">[{{ line.type }}]</span>
        <span class="ml-2">{{ line.message }}</span>
      </div>
      <div ref="scrollEnd"></div>
    </div>
    
    <div class="bg-slate-900 p-3 border-t border-slate-700">
      <input 
        v-model="command" 
        @keydown.enter="executeCommand"
        type="text"
        placeholder="eval JavaScript..."
        class="w-full bg-slate-800 text-white px-3 py-2 rounded text-xs border border-slate-700"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount, defineProps, defineEmits } from 'vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])
const logs = ref([])
const command = ref('')
const scrollEnd = ref(null)

// Capture console logs
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn
const originalInfo = console.info

const addLog = (type, args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')
  logs.value.push({ type, message })
  if (logs.value.length > 1000) logs.value.shift()
  nextTick(() => {
    scrollEnd.value?.scrollIntoView()
  })
}

console.log = (...args) => {
  originalLog(...args)
  addLog('log', args)
}

console.error = (...args) => {
  originalError(...args)
  addLog('error', args)
}

console.warn = (...args) => {
  originalWarn(...args)
  addLog('warn', args)
}

console.info = (...args) => {
  originalInfo(...args)
  addLog('info', args)
}

function lineColor(type) {
  switch (type) {
    case 'error': return 'text-red-400'
    case 'warn': return 'text-yellow-400'
    case 'info': return 'text-blue-400'
    default: return 'text-white'
  }
}

function executeCommand() {
  if (!command.value.trim()) return
  
  try {
    const result = eval(command.value)
    console.log('→', result)
  } catch (error) {
    console.error(error.message)
  }
  command.value = ''
}

onMounted(() => {
  console.log('Console overlay ready.')
})
</script>
