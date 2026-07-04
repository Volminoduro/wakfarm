import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useInfiniteScroll({ items, itemsPerPage = 20 }) {
  const visibleCount = ref(itemsPerPage)
  const sentinel = ref(null)

  const visibleItems = computed(() => items.value.slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < items.value.length)

  function loadMore() {
    if (!hasMore.value) return
    visibleCount.value = Math.min(visibleCount.value + itemsPerPage, items.value.length)
  }

  function reset() {
    visibleCount.value = itemsPerPage
  }

  let observer = null

  function setupObserver() {
    if (observer) observer.disconnect()
    if (!sentinel.value) return

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel.value)
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  watch(sentinel, () => {
    setupObserver()
  })

  watch(() => items.value.length, () => {
    reset()
  })

  return {
    visibleItems,
    hasMore,
    visibleCount,
    sentinel,
    reset
  }
}
