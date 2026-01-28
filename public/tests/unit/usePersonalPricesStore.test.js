import { beforeEach, describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('usePersonalPricesStore', () => {
  let store

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = usePersonalPricesStore()
  })

  describe('init', () => {
    it('should load prices from localStorage', () => {
      const mockPrices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPrices))

      store.init()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('wakfarm_personal_prices')
      expect(store.prices).toEqual(mockPrices)
    })

    it('should handle empty localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null)

      store.init()

      expect(store.prices).toEqual({})
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')

      store.init()

      expect(store.prices).toEqual({})
    })
  })

  describe('updatePrice', () => {
    it('should update price for an item', () => {
      store.updatePrice('pandora', 123, 5000)

      expect(store.prices.pandora[123]).toMatchObject({
        price: 5000,
        lastUpdated: expect.any(Number)
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wakfarm_personal_prices',
        expect.any(String)
      )
    })

    it('should create server object if it does not exist', () => {
      store.updatePrice('newserver', 456, 3000)

      expect(store.prices.newserver).toBeDefined()
      expect(store.prices.newserver[456]).toMatchObject({
        price: 3000
      })
    })

    it('should delete price when newPrice is null', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }

      store.updatePrice('pandora', 123, null)

      expect(store.prices.pandora[123]).toBeUndefined()
    })

    it('should delete price when newPrice is empty string', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }

      store.updatePrice('pandora', 123, '')

      expect(store.prices.pandora[123]).toBeUndefined()
    })

    it('should save to localStorage after update', () => {
      store.updatePrice('pandora', 123, 5000)

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.pandora[123].price).toBe(5000)
    })
  })

  describe('getPrice', () => {
    it('should return price for an existing item', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }

      const price = store.getPrice('pandora', 123)

      expect(price).toBe(1000)
    })

    it('should return null for non-existing item', () => {
      const price = store.getPrice('pandora', 999)

      expect(price).toBeNull()
    })

    it('should return null for non-existing server', () => {
      const price = store.getPrice('nonexistent', 123)

      expect(price).toBeNull()
    })
  })

  describe('hasPersonalPrice', () => {
    it('should return true when item has a personal price', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }

      expect(store.hasPersonalPrice('pandora', 123)).toBe(true)
    })

    it('should return false when item does not have a personal price', () => {
      expect(store.hasPersonalPrice('pandora', 999)).toBe(false)
    })

    it('should return false for non-existing server', () => {
      expect(store.hasPersonalPrice('nonexistent', 123)).toBe(false)
    })
  })

  describe('clearAll', () => {
    it('should clear all prices', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        },
        rubilax: {
          456: { price: 2000, lastUpdated: Date.now() }
        }
      }

      store.clearAll()

      expect(store.prices).toEqual({})
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wakfarm_personal_prices',
        '{}'
      )
    })
  })

  describe('clearServer', () => {
    it('should clear prices for a specific server', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        },
        rubilax: {
          456: { price: 2000, lastUpdated: Date.now() }
        }
      }

      store.clearServer('pandora')

      expect(store.prices.pandora).toBeUndefined()
      expect(store.prices.rubilax).toBeDefined()
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should do nothing if server does not exist', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }

      store.clearServer('nonexistent')

      expect(store.prices.pandora).toBeDefined()
    })
  })

  describe('saveToLocalStorage', () => {
    it('should persist prices to localStorage', () => {
      store.prices = {
        pandora: {
          123: { price: 1000, lastUpdated: 1234567890 }
        }
      }

      store.saveToLocalStorage()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wakfarm_personal_prices',
        JSON.stringify(store.prices)
      )
    })
  })

  describe('loadFromLocalStorage', () => {
    it('should load valid JSON from localStorage', () => {
      const mockPrices = {
        pandora: {
          123: { price: 1000, lastUpdated: Date.now() }
        }
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPrices))

      store.loadFromLocalStorage()

      expect(store.prices).toEqual(mockPrices)
    })

    it('should reset prices on parse error', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')

      store.loadFromLocalStorage()

      expect(store.prices).toEqual({})
    })
  })
})
