import { describe, it, expect } from 'vitest'
import { calculateResourceExpectedKamas, optimizeHarvestForTime } from '@/utils/harvestProfit'

describe('harvestProfit', () => {
  describe('calculateResourceExpectedKamas', () => {
    it('applique dropRate, expectedQuantity et bonus cumulé', () => {
      const resource = {
        loots: [
          { itemId: 1001, dropRate: 0.5, expectedQuantity: 2 },
          { itemId: 1002, dropRate: 0.25, expectedQuantity: 4 }
        ]
      }
      const priceMap = {
        1001: 100,
        1002: 50
      }

      const result = calculateResourceExpectedKamas(resource, priceMap, 50)

      expect(result).toBe(225)
    })

    it('ignore les bonus négatifs (minimum à 0)', () => {
      const resource = {
        loots: [
          { itemId: 42, dropRate: 0.5, expectedQuantity: 2 }
        ]
      }
      const priceMap = { 42: 100 }

      const result = calculateResourceExpectedKamas(resource, priceMap, -30)

      expect(result).toBe(100)
    })
  })

  describe('optimizeHarvestForTime', () => {
    it('compte les récoltes avec actionSeconds en priorité', () => {
      const resources = [
        {
          primaryItemId: 2001,
          actionSeconds: 3,
          timeSeconds: 30,
          expectedKamas: 10
        }
      ]

      const optimized = optimizeHarvestForTime(resources, 10)

      expect(optimized.usedSeconds).toBe(9)
      expect(optimized.unusedSeconds).toBe(1)
      expect(optimized.totalKamas).toBe(30)
      expect(optimized.picks).toEqual([
        {
          itemId: 2001,
          count: 3,
          totalSeconds: 9,
          totalKamas: 30
        }
      ])
    })

    it('n’utilise pas timeSeconds si actionSeconds est absent', () => {
      const resources = [
        {
          primaryItemId: 3001,
          timeSeconds: 4,
          expectedKamas: 5
        }
      ]

      const optimized = optimizeHarvestForTime(resources, 10)

      expect(optimized.usedSeconds).toBe(0)
      expect(optimized.unusedSeconds).toBe(10)
      expect(optimized.totalKamas).toBe(0)
      expect(optimized.picks).toEqual([])
    })
  })
})