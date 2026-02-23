import { describe, it, expect } from 'vitest'
import { calculateCraftExpectedKamas, buildItemJobSkillIdsMap, getAllJobSkillIds, selectCraftPicks } from '@/utils/craftProfit'

describe('craftProfit utilities', () => {
  describe('calculateCraftExpectedKamas', () => {
    it('calculates positive craft margin', () => {
      const craft = {
        resultItemId: 100,
        resultQuantity: 2,
        ingredients: [
          { itemId: 1, quantity: 3 },
          { itemId: 2, quantity: 1 }
        ]
      }

      const priceMap = {
        100: 500,
        1: 100,
        2: 200
      }

      expect(calculateCraftExpectedKamas(craft, priceMap)).toBe(500)
    })

    it('never returns negative margin', () => {
      const craft = {
        resultItemId: 100,
        resultQuantity: 1,
        ingredients: [{ itemId: 1, quantity: 10 }]
      }

      const priceMap = {
        100: 100,
        1: 20
      }

      expect(calculateCraftExpectedKamas(craft, priceMap)).toBe(0)
    })

    it('returns 0 when one ingredient price is missing', () => {
      const craft = {
        resultItemId: 100,
        resultQuantity: 1,
        ingredients: [
          { itemId: 1, quantity: 2 },
          { itemId: 2, quantity: 1 }
        ]
      }

      const priceMap = {
        100: 1000,
        1: 100
      }

      expect(calculateCraftExpectedKamas(craft, priceMap)).toBe(0)
    })

    it('returns 0 when one ingredient price is empty/zero', () => {
      const craft = {
        resultItemId: 100,
        resultQuantity: 1,
        ingredients: [
          { itemId: 1, quantity: 2 },
          { itemId: 2, quantity: 1 }
        ]
      }

      const priceMap = {
        100: 1000,
        1: '',
        2: 100
      }

      expect(calculateCraftExpectedKamas(craft, priceMap)).toBe(0)
    })

    it('handles non-numeric and negative values safely', () => {
      const craft = {
        resultItemId: 100,
        resultQuantity: '-2',
        ingredients: [
          { itemId: 1, quantity: -3 },
          { itemId: 2, quantity: 'foo' }
        ]
      }

      const priceMap = {
        100: 500,
        1: 100,
        2: 200
      }

      expect(calculateCraftExpectedKamas(craft, priceMap)).toBe(0)
    })
  })

  describe('buildItemJobSkillIdsMap', () => {
    it('maps items to both harvest and craft jobs', () => {
      const harvestResources = [
        {
          jobSkillId: 64,
          loots: [{ itemId: 1 }, { itemId: 2 }]
        },
        {
          jobSkillId: 71,
          loots: [{ itemId: 2 }]
        }
      ]

      const crafts = [
        { jobId: 77, resultItemId: 500 },
        { jobId: 78, resultItemId: 2 }
      ]

      const map = buildItemJobSkillIdsMap(harvestResources, crafts)

      expect([...map.get(1)]).toEqual([64])
      expect([...map.get(2)].sort((a, b) => a - b)).toEqual([64, 71, 78])
      expect([...map.get(500)]).toEqual([77])
    })

    it('maps craft ingredient items to the craft job', () => {
      const harvestResources = []

      const crafts = [
        {
          jobId: 77,
          resultItemId: 500,
          ingredients: [{ itemId: 10 }, { itemId: 20 }]
        },
        {
          jobId: 78,
          resultItemId: 2,
          ingredients: [{ itemId: 20 }, { itemId: 30 }]
        }
      ]

      const map = buildItemJobSkillIdsMap(harvestResources, crafts)

      // Result items mapped to their job
      expect([...map.get(500)]).toEqual([77])
      expect([...map.get(2)]).toEqual([78])
      
      // Ingredient items also mapped to craft jobs
      expect([...map.get(10)]).toEqual([77])
      expect([...map.get(20)].sort((a, b) => a - b)).toEqual([77, 78])
      expect([...map.get(30)]).toEqual([78])
    })

    it('ignores invalid item and skill ids', () => {
      const harvestResources = [
        {
          jobSkillId: 0,
          loots: [{ itemId: 1 }]
        },
        {
          jobSkillId: 64,
          loots: [{ itemId: -2 }, { itemId: '3.8' }]
        }
      ]

      const crafts = [
        { jobId: '77.9', resultItemId: '500.3' },
        { jobId: 'abc', resultItemId: 8 }
      ]

      const map = buildItemJobSkillIdsMap(harvestResources, crafts)

      expect([...map.get(3)]).toEqual([64])
      expect([...map.get(500)]).toEqual([77])
      expect(map.has(1)).toBe(false)
      expect(map.has(8)).toBe(false)
    })
  })

  describe('getAllJobSkillIds', () => {
    it('returns unique ids from harvest and crafts', () => {
      const harvestResources = [
        { jobSkillId: 64 },
        { jobSkillId: 71 }
      ]
      const crafts = [
        { jobId: 77 },
        { jobId: 64 }
      ]

      const ids = getAllJobSkillIds(harvestResources, crafts)
      expect(ids.sort((a, b) => a - b)).toEqual([64, 71, 77])
    })
  })

  describe('selectCraftPicks', () => {
    it('keeps top pick and marks alternatives', () => {
      const crafts = [
        {
          resultItemId: 100,
          resultQuantity: 1,
          levelRequired: 6,
          ingredients: [{ itemId: 1, quantity: 1 }]
        },
        {
          resultItemId: 200,
          resultQuantity: 1,
          levelRequired: 10,
          ingredients: [{ itemId: 2, quantity: 1 }]
        }
      ]

      const priceMap = {
        100: 150,
        200: 120,
        1: 50,
        2: 90
      }

      const { primaryPick, picks, totalKamas } = selectCraftPicks(crafts, priceMap, 0, {})

      expect(primaryPick.itemId).toBe(100)
      expect(primaryPick.isEligible).toBe(true)
      expect(picks).toHaveLength(2)
      expect(picks[1].isAlternative).toBe(true)
      expect(totalKamas).toBe(100)
    })

    it('filters out picks below min profit', () => {
      const crafts = [
        {
          resultItemId: 100,
          resultQuantity: 1,
          levelRequired: 6,
          ingredients: [{ itemId: 1, quantity: 1 }]
        },
        {
          resultItemId: 200,
          resultQuantity: 1,
          levelRequired: 10,
          ingredients: [{ itemId: 2, quantity: 1 }]
        }
      ]

      const priceMap = {
        100: 150,
        200: 120,
        1: 50,
        2: 90
      }

      const { primaryPick, picks, totalKamas } = selectCraftPicks(crafts, priceMap, 120, {})

      expect(primaryPick).toBe(null)
      expect(picks).toHaveLength(0)
      expect(totalKamas).toBe(0)
    })
  })
})
