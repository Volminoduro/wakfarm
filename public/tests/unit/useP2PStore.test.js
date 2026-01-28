import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Gun.js
const mockGun = {
  get: vi.fn(() => mockGun),
  on: vi.fn(),
  set: vi.fn(),
  put: vi.fn(() => mockGun),
  map: vi.fn(() => mockGun),
  once: vi.fn()
}
vi.mock('gun', () => ({
  default: vi.fn(() => mockGun)
}))

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

import { useP2PStore } from '@/stores/useP2PStore'

describe('useP2PStore', () => {
  let store

  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    store = useP2PStore()
    // Mock gun instance
    store.gun = mockGun
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('generateMachineID', () => {
    it('should return hashed MAC from Tauri invoke', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      invoke.mockResolvedValue('hashed-mac-id')

      const id = await store.generateMachineID()
      expect(id).toBe('hashed-mac-id')
      expect(invoke).toHaveBeenCalledWith('get_machine_id')
    })

    it('should fallback to crypto.randomUUID on error', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      invoke.mockRejectedValue(new Error('MAC error'))

      const id = await store.generateMachineID()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0) // UUID format
    })
  })

  describe('updatePrice', () => {
    it('should update price in GunDB and add to history', async () => {
      store.machineID = 'test-id'
      store.prices = { Pandora: { 123: { price: 100 } } }

      // Mock the chain for prices
      const putSpy = vi.fn()
      const setSpy = vi.fn()
      
      // Mock gun.get to return appropriate objects
      mockGun.get.mockImplementation((key) => {
        if (key === 'prices') {
          return {
            get: vi.fn(() => ({
              get: vi.fn(() => ({
                put: putSpy
              }))
            }))
          }
        } else if (key === 'history') {
          return { set: setSpy }
        }
        return mockGun
      })

      await store.updatePrice('Pandora', 123, 200)

      expect(putSpy).toHaveBeenCalledWith({
        price: 200,
        lastUpdated: expect.any(Number),
        authorID: 'test-id'
      })
      expect(setSpy).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        authorID: 'test-id',
        server: 'Pandora',
        itemId: 123,
        oldPrice: 100,
        newPrice: 200
      })
    })
  })

  describe('isBlocked', () => {
    it('should return true if ID is in blacklist', () => {
      store.blacklist = ['blocked-id']
      expect(store.isBlocked('blocked-id')).toBe(true)
      expect(store.isBlocked('safe-id')).toBe(false)
    })
  })

  describe('loadHistory', () => {
    it('should load and limit history to 1000 entries', () => {
      const mockData = Array.from({ length: 1500 }, (_, i) => ({ id: i }))
      mockGun.get.mockReturnValue({
        on: vi.fn((callback) => callback(mockData))
      })

      store.loadHistory()
      expect(store.history).toHaveLength(1000)
      expect(store.history[0]).toEqual({ id: 500 }) // Last 1000
    })
  })
})