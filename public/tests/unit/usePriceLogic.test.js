import { beforeEach, describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePriceLogic } from '@/composables/usePriceLogic'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useP2PStore } from '@/stores/useP2PStore'
import { useAppStore } from '@/stores/useAppStore'

// Mock Gun.js
vi.mock('gun', () => ({
  default: vi.fn(() => ({
    get: vi.fn(() => ({
      get: vi.fn(() => ({
        put: vi.fn()
      })),
      on: vi.fn(),
      set: vi.fn()
    }))
  }))
}))

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('usePriceLogic', () => {
  let personalStore
  let p2pStore
  let appStore
  let priceLogic

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    
    personalStore = usePersonalPricesStore()
    p2pStore = useP2PStore()
    appStore = useAppStore()
    priceLogic = usePriceLogic()

    // Setup default config
    appStore.config = { server: 'pandora' }
  })

  describe('getPrice', () => {
    it('should return personal price when available', () => {
      personalStore.prices = {
        pandora: {
          123: { price: 5000, lastUpdated: Date.now() }
        }
      }
      p2pStore.prices = {
        pandora: {
          123: { price: 3000 }
        }
      }

      const result = priceLogic.getPrice('pandora', 123)

      expect(result).toEqual({
        price: 5000,
        isPersonal: true
      })
    })

    it('should return collective price when personal is not available', () => {
      p2pStore.prices = {
        pandora: {
          123: { price: 3000 }
        }
      }

      const result = priceLogic.getPrice('pandora', 123)

      expect(result).toEqual({
        price: 3000,
        isPersonal: false
      })
    })

    it('should return null when no price is available', () => {
      const result = priceLogic.getPrice('pandora', 999)

      expect(result).toEqual({
        price: null,
        isPersonal: false
      })
    })

    it('should prioritize personal over collective price', () => {
      personalStore.prices = {
        pandora: {
          123: { price: 10000, lastUpdated: Date.now() }
        }
      }
      p2pStore.prices = {
        pandora: {
          123: { price: 1000 }
        }
      }

      const result = priceLogic.getPrice('pandora', 123)

      expect(result.price).toBe(10000)
      expect(result.isPersonal).toBe(true)
    })

    it('should handle different servers independently', () => {
      personalStore.prices = {
        pandora: {
          123: { price: 5000, lastUpdated: Date.now() }
        }
      }
      p2pStore.prices = {
        rubilax: {
          123: { price: 3000 }
        }
      }

      const pandoraResult = priceLogic.getPrice('pandora', 123)
      const rubilaxResult = priceLogic.getPrice('rubilax', 123)

      expect(pandoraResult.price).toBe(5000)
      expect(pandoraResult.isPersonal).toBe(true)
      expect(rubilaxResult.price).toBe(3000)
      expect(rubilaxResult.isPersonal).toBe(false)
    })
  })

  describe('getCurrentPrice', () => {
    it('should use appStore.config.server', () => {
      appStore.config.server = 'rubilax'
      personalStore.prices = {
        rubilax: {
          456: { price: 7000, lastUpdated: Date.now() }
        }
      }

      const result = priceLogic.getCurrentPrice(456)

      expect(result.price).toBe(7000)
      expect(result.isPersonal).toBe(true)
    })

    it('should return personal price for current server', () => {
      appStore.config.server = 'pandora'
      personalStore.prices = {
        pandora: {
          123: { price: 5000, lastUpdated: Date.now() }
        }
      }

      const result = priceLogic.getCurrentPrice(123)

      expect(result).toEqual({
        price: 5000,
        isPersonal: true
      })
    })

    it('should return collective price for current server when no personal price', () => {
      appStore.config.server = 'pandora'
      p2pStore.prices = {
        pandora: {
          123: { price: 3000 }
        }
      }

      const result = priceLogic.getCurrentPrice(123)

      expect(result).toEqual({
        price: 3000,
        isPersonal: false
      })
    })
  })

  describe('hasPersonalPrice', () => {
    it('should return true when personal price exists', () => {
      personalStore.prices = {
        pandora: {
          123: { price: 5000, lastUpdated: Date.now() }
        }
      }

      expect(priceLogic.hasPersonalPrice('pandora', 123)).toBe(true)
    })

    it('should return false when personal price does not exist', () => {
      expect(priceLogic.hasPersonalPrice('pandora', 999)).toBe(false)
    })

    it('should not be affected by collective prices', () => {
      p2pStore.prices = {
        pandora: {
          123: { price: 3000 }
        }
      }

      expect(priceLogic.hasPersonalPrice('pandora', 123)).toBe(false)
    })
  })

  describe('hasCurrentPersonalPrice', () => {
    it('should check personal price for current server', () => {
      appStore.config.server = 'rubilax'
      personalStore.prices = {
        rubilax: {
          456: { price: 7000, lastUpdated: Date.now() }
        }
      }

      expect(priceLogic.hasCurrentPersonalPrice(456)).toBe(true)
    })

    it('should return false when no personal price for current server', () => {
      appStore.config.server = 'pandora'

      expect(priceLogic.hasCurrentPersonalPrice(999)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined server in personal prices', () => {
      const result = priceLogic.getPrice('nonexistent', 123)

      expect(result).toEqual({
        price: null,
        isPersonal: false
      })
    })

    it('should handle undefined server in collective prices', () => {
      const result = priceLogic.getPrice('nonexistent', 123)

      expect(result).toEqual({
        price: null,
        isPersonal: false
      })
    })

    it('should handle null price value', () => {
      personalStore.prices = {
        pandora: {
          123: { price: null, lastUpdated: Date.now() }
        }
      }

      const result = priceLogic.getPrice('pandora', 123)

      // null price should be treated as no price, fallback to collective
      expect(result.isPersonal).toBe(false)
    })

    it('should handle string itemId', () => {
      personalStore.prices = {
        pandora: {
          '123': { price: 5000, lastUpdated: Date.now() }
        }
      }

      const result = priceLogic.getPrice('pandora', '123')

      expect(result.price).toBe(5000)
    })

    it('should handle numeric itemId', () => {
      personalStore.prices = {
        pandora: {
          123: { price: 5000, lastUpdated: Date.now() }
        }
      }

      const result = priceLogic.getPrice('pandora', 123)

      expect(result.price).toBe(5000)
    })
  })
})
