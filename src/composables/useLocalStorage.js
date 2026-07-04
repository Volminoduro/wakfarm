import { ref, watch } from 'vue'

// Cache par clé : { ref, defaultValue }
const storageCache = new Map()

// Single shared storage event listener dispatching to all registered keys
let storageListenerActive = false
function ensureStorageListener() {
  if (storageListenerActive || typeof window === 'undefined') return
  storageListenerActive = true
  window.addEventListener('storage', (e) => {
    if (!e || e.key === null) return
    const entry = storageCache.get(e.key)
    if (!entry) return
    try {
      entry.ref.value = e.newValue !== null ? JSON.parse(e.newValue) : entry.defaultValue
    } catch {
      // ignore parse errors
    }
  })
}

export function useLocalStorage(key, defaultValue, options = {}) {
  const { deep = false } = options

  if (storageCache.has(key)) return storageCache.get(key).ref

  const loadValue = () => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const value = ref(loadValue())

  watch(
    value,
    (newVal) => {
      try {
        localStorage.setItem(key, JSON.stringify(newVal))
      } catch (error) {
        console.error(`Erreur sauvegarde localStorage [${key}]:`, error)
      }
    },
    { deep, immediate: false }
  )

  storageCache.set(key, { ref: value, defaultValue })
  ensureStorageListener()
  return value
}
