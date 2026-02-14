import { ref } from 'vue'

export function useChunkedBuilder({ getBase, buildItem, sortFn, chunkSize = 40 }) {
  const results = ref([])
  let buildToken = 0

  async function rebuild() {
    const token = ++buildToken
    const base = getBase()
    if (!Array.isArray(base) || base.length === 0) {
      results.value = []
      return
    }

    const next = []
    for (let i = 0; i < base.length; i += chunkSize) {
      if (token !== buildToken) return
      const chunk = base.slice(i, i + chunkSize)
      chunk.forEach(item => {
        const built = buildItem(item)
        if (Array.isArray(built)) {
          built.forEach(entry => {
            if (entry) next.push(entry)
          })
          return
        }
        if (built) next.push(built)
      })
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    if (token !== buildToken) return
    if (typeof sortFn === 'function') next.sort(sortFn)
    results.value = next
  }

  return { results, rebuild }
}
