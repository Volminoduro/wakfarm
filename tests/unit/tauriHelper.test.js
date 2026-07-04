import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isTauriAvailable, safeTauriInvoke } from '@/utils/tauriHelper'

describe('tauriHelper', () => {
  let originalWindow

  beforeEach(() => {
    originalWindow = global.window
  })

  afterEach(() => {
    global.window = originalWindow
  })

  describe('isTauriAvailable', () => {
    it('should return false when window.__TAURI_INTERNALS__ is undefined', () => {
      global.window = {}
      expect(isTauriAvailable()).toBe(false)
    })

    it('should return false when window is undefined', () => {
      global.window = undefined
      expect(isTauriAvailable()).toBe(false)
    })

    it('should return true when __TAURI_INTERNALS__ exists', () => {
      global.window = {
        __TAURI_INTERNALS__: {}
      }
      expect(isTauriAvailable()).toBe(true)
    })
  })

  describe('safeTauriInvoke', () => {
    it('should return null when Tauri is not available', async () => {
      global.window = {}
      
      const mockFn = async () => 'should not be called'
      const result = await safeTauriInvoke(mockFn)
      
      expect(result).toBe(null)
    })

    it('should call the function when Tauri is available', async () => {
      global.window = {
        __TAURI_INTERNALS__: {}
      }

      const mockFn = async (arg) => `result: ${arg}`
      const result = await safeTauriInvoke(mockFn, 'test')
      
      expect(result).toBe('result: test')
    })

    it('should handle function errors gracefully', async () => {
      global.window = {
        __TAURI_INTERNALS__: {}
      }

      const mockFn = async () => {
        throw new Error('Tauri error')
      }
      
      const result = await safeTauriInvoke(mockFn)
      
      expect(result).toBe(null)
    })
  })
})
