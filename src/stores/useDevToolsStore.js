import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDevToolsStore = defineStore('devTools', () => {
  const showDebug = ref(false)
  const showConsole = ref(false)

  const toggleDebug = () => {
    showDebug.value = !showDebug.value
  }

  const toggleConsole = () => {
    showConsole.value = !showConsole.value
  }

  return {
    showDebug,
    showConsole,
    toggleDebug,
    toggleConsole
  }
})
