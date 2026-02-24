import { describe, it, expect, beforeEach } from 'vitest'
import { isPriceWithinAgeLimit, filterPricesByAge } from '@/utils/priceFilter'

describe('priceFilter utilities', () => {
  const now = Date.now()

  describe('isPriceWithinAgeLimit', () => {
    it('should include price with no age limit', () => {
      const oldTimestamp = now - 90 * 24 * 60 * 60 * 1000 // 90 days ago
      expect(isPriceWithinAgeLimit(oldTimestamp, null)).toBe(true)
    })

    it('should include price with no age limit when maxAgeDays is 0', () => {
      const oldTimestamp = now - 90 * 24 * 60 * 60 * 1000
      expect(isPriceWithinAgeLimit(oldTimestamp, 0)).toBe(true)
    })

    it('should exclude price with no timestamp', () => {
      expect(isPriceWithinAgeLimit(undefined, 1)).toBe(false)
    })

    it('should include price within 1 day', () => {
      const recentTimestamp = now - 12 * 60 * 60 * 1000 // 12 hours ago
      expect(isPriceWithinAgeLimit(recentTimestamp, 1)).toBe(true)
    })

    it('should exclude price older than 1 day', () => {
      const oldTimestamp = now - 2 * 24 * 60 * 60 * 1000 // 2 days ago
      expect(isPriceWithinAgeLimit(oldTimestamp, 1)).toBe(false)
    })

    it('should include price within 7 days', () => {
      const weekOldTimestamp = now - 5 * 24 * 60 * 60 * 1000 // 5 days ago
      expect(isPriceWithinAgeLimit(weekOldTimestamp, 7)).toBe(true)
    })

    it('should exclude price older than 7 days', () => {
      const oldTimestamp = now - 10 * 24 * 60 * 60 * 1000 // 10 days ago
      expect(isPriceWithinAgeLimit(oldTimestamp, 7)).toBe(false)
    })

    it('should include price within 30 days', () => {
      const monthOldTimestamp = now - 20 * 24 * 60 * 60 * 1000 // 20 days ago
      expect(isPriceWithinAgeLimit(monthOldTimestamp, 30)).toBe(true)
    })

    it('should include price within 90 days', () => {
      const quarterOldTimestamp = now - 60 * 24 * 60 * 60 * 1000 // 60 days ago
      expect(isPriceWithinAgeLimit(quarterOldTimestamp, 90)).toBe(true)
    })
  })

  describe('filterPricesByAge', () => {
    it('should return empty map if no prices provided', () => {
      expect(filterPricesByAge(null, 7)).toEqual({})
      expect(filterPricesByAge({}, 7)).toEqual({})
    })

    it('should return original prices when maxAgeDays is null (no filtering)', () => {
      const priceMap = {
        100: { price: 1000, lastUpdated: now - 90 * 24 * 60 * 60 * 1000 },
        101: { price: 2000, lastUpdated: now - 1000 }
      }
      const result = filterPricesByAge(priceMap, null)
      // When no filter, returns the original map unchanged
      expect(result).toBe(priceMap)
    })

    it('should return original prices when maxAgeDays is 0', () => {
      const priceMap = {
        100: { price: 1000, lastUpdated: now - 90 * 24 * 60 * 60 * 1000 },
        101: { price: 2000, lastUpdated: now - 1000 }
      }
      const result = filterPricesByAge(priceMap, 0)
      expect(result).toBe(priceMap)
    })

    it('should filter prices by age limit', () => {
      const recentTimestamp = now - 2 * 60 * 60 * 1000 // 2 hours ago
      const oldTimestamp = now - 10 * 24 * 60 * 60 * 1000 // 10 days ago

      const priceMap = {
        100: { price: 1000, lastUpdated: recentTimestamp },
        101: { price: 2000, lastUpdated: oldTimestamp }
      }

      const result = filterPricesByAge(priceMap, 7)
      expect(result).toEqual({ 100: 1000 })
      expect(result[101]).toBeUndefined()
    })

    it('should exclude prices without timestamps', () => {
      const priceMap = {
        100: { price: 1000, lastUpdated: now - 2 * 60 * 60 * 1000 },
        101: { price: 2000 }
      }

      const result = filterPricesByAge(priceMap, 7)
      expect(result).toEqual({ 100: 1000 })
    })

    it('should handle numeric price values in map', () => {
      const priceMap = {
        100: 1000,
        101: 2000
      }

      const result = filterPricesByAge(priceMap, 7)
      // Prices without timestamps should be excluded
      expect(result).toEqual({})
    })

    it('should handle mixed format prices', () => {
      const recentTimestamp = now - 1000
      const priceMap = {
        100: { price: 1000, lastUpdated: recentTimestamp },
        101: 2000 // No timestamp
      }

      const result = filterPricesByAge(priceMap, 7)
      expect(result).toEqual({ 100: 1000 })
    })

    it('should correctly filter with 1 day limit', () => {
      const within1Day = now - 12 * 60 * 60 * 1000
      const over1Day = now - 2 * 24 * 60 * 60 * 1000

      const priceMap = {
        100: { price: 1000, lastUpdated: within1Day },
        101: { price: 2000, lastUpdated: over1Day }
      }

      const result = filterPricesByAge(priceMap, 1)
      expect(Object.keys(result)).toEqual(['100'])
    })

    it('should correctly filter with 30 day limit', () => {
      const within30Days = now - 15 * 24 * 60 * 60 * 1000
      const over30Days = now - 45 * 24 * 60 * 60 * 1000

      const priceMap = {
        100: { price: 1000, lastUpdated: within30Days },
        101: { price: 2000, lastUpdated: over30Days }
      }

      const result = filterPricesByAge(priceMap, 30)
      expect(Object.keys(result)).toEqual(['100'])
    })
  })
})
