import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useInfiniteScroll({ items, itemsPerPage = 20, threshold = 500 }) {
  const visibleCount = ref(itemsPerPage)

  const visibleItems = computed(() => items.value.slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < items.value.length)

  function reset() {
    visibleCount.value = itemsPerPage
  }

  function handleScroll() {
    if (!hasMore.value) return
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    if (scrollTop + windowHeight >= documentHeight - threshold) {
      visibleCount.value = Math.min(visibleCount.value + itemsPerPage, items.value.length)
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  watch(() => items.value.length, () => {
    reset()
  })

  return {
    visibleItems,
    hasMore,
    visibleCount,
    reset
  }
}
