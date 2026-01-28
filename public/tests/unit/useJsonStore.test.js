import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Tests for useJsonStore data loading and price retrieval
// Note: JSON price loading has been removed. Prices are now managed exclusively through
// personal (localStorage) and P2P (Gun.js) stores.

describe('useJsonStore - data loading and price retrieval', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getPriceMapWithPersonal', () => {
    it('returns empty map when no personal prices exist', async () => {
      vi.doMock('@/stores/usePersonalPricesStore', () => ({
        usePersonalPricesStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/stores/useP2PStore', () => ({
        useP2PStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/composables/usePriceLogic', () => ({
        usePriceLogic: () => ({
          getPrice: () => ({ price: null, isPersonal: false })
        })
      }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      const result = store.getPriceMapWithPersonal('Pandora')

      expect(result).toEqual({})
    })

    it('returns unified map with personal prices', async () => {
      const mockGetPrice = vi.fn((server, itemId) => {
        if (itemId === '123') {
          return { price: 1000, isPersonal: true }
        }
        return { price: null, isPersonal: false }
      })

      vi.doMock('@/stores/usePersonalPricesStore', () => ({
        usePersonalPricesStore: () => ({
          prices: {
            'Pandora': {
              '123': { price: 1000, lastUpdated: Date.now() }
            }
          }
        })
      }))
      vi.doMock('@/stores/useP2PStore', () => ({
        useP2PStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/composables/usePriceLogic', () => ({
        usePriceLogic: () => ({
          getPrice: mockGetPrice
        })
      }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      const result = store.getPriceMapWithPersonal('Pandora')

      expect(result).toHaveProperty('123')
      expect(result['123']).toBe(1000)
    })

    it('includes items from personal prices only', async () => {
      const personalPrices = {
        'Pandora': {
          '1': { price: 500, lastUpdated: Date.now() },
          '2': { price: 1500, lastUpdated: Date.now() }
        }
      }

      const mockGetPrice = vi.fn((server, itemId) => {
        const price = personalPrices[server]?.[itemId]?.price
        return { price: price || null, isPersonal: !!price }
      })

      vi.doMock('@/stores/usePersonalPricesStore', () => ({
        usePersonalPricesStore: () => ({
          prices: personalPrices
        })
      }))
      vi.doMock('@/stores/useP2PStore', () => ({
        useP2PStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/composables/usePriceLogic', () => ({
        usePriceLogic: () => ({
          getPrice: mockGetPrice
        })
      }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      const result = store.getPriceMapWithPersonal('Pandora')

      expect(Object.keys(result).length).toBe(2)
      expect(result['1']).toBe(500)
      expect(result['2']).toBe(1500)
    })
  })

  describe('pricesLastUpdate cache invalidation', () => {
    it('pricesLastUpdate is null by default', async () => {
      vi.doMock('@/stores/usePersonalPricesStore', () => ({
        usePersonalPricesStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/stores/useP2PStore', () => ({
        useP2PStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/composables/usePriceLogic', () => ({
        usePriceLogic: () => ({
          getPrice: () => ({ price: null, isPersonal: false })
        })
      }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()
      
      expect(store.pricesLastUpdate).toBeNull()
    })

    it('can be set to trigger cache invalidation', async () => {
      vi.doMock('@/stores/usePersonalPricesStore', () => ({
        usePersonalPricesStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/stores/useP2PStore', () => ({
        useP2PStore: () => ({
          prices: {}
        })
      }))
      vi.doMock('@/composables/usePriceLogic', () => ({
        usePriceLogic: () => ({
          getPrice: () => ({ price: null, isPersonal: false })
        })
      }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      expect(store.pricesLastUpdate).toBeNull()

      store.pricesLastUpdate = Date.now()

      expect(store.pricesLastUpdate).not.toBeNull()
      expect(typeof store.pricesLastUpdate).toBe('number')
    })
  })
})
