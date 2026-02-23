export const HARVEST_JOB_SKILL_IDS = [64, 71, 72, 73, 74, 75]
export const CRAFT_JOB_SKILL_IDS = [40, 76, 77, 78, 79, 80, 81, 83]

function toNonNegativeNumber(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

function toPositiveInteger(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.trunc(parsed)
}

function hasUsablePrice(priceMap, itemId) {
  if (!priceMap || itemId === null || itemId === undefined) return false
  if (!Object.prototype.hasOwnProperty.call(priceMap, itemId)) return false
  return toNonNegativeNumber(priceMap[itemId]) > 0
}

export function calculateCraftExpectedKamas(craft, priceMap) {
  if (!craft || !priceMap) return 0

  const resultItemId = Number(craft.resultItemId)
  const resultQuantity = toNonNegativeNumber(craft.resultQuantity)
  const resultPrice = toNonNegativeNumber(priceMap[resultItemId])
  const resultValue = resultPrice * resultQuantity

  const ingredients = Array.isArray(craft.ingredients) ? craft.ingredients : []
  const hasMissingIngredientPrice = ingredients.some((ingredient) => {
    const ingredientItemId = Number(ingredient?.itemId)
    return !hasUsablePrice(priceMap, ingredientItemId)
  })

  if (hasMissingIngredientPrice) return 0

  const ingredientsCost = ingredients.reduce((sum, ingredient) => {
    const ingredientItemId = Number(ingredient.itemId)
    const ingredientQuantity = toNonNegativeNumber(ingredient.quantity)
    const ingredientPrice = toNonNegativeNumber(priceMap[ingredientItemId])
    return sum + (ingredientPrice * ingredientQuantity)
  }, 0)

  return Math.max(0, resultValue - ingredientsCost)
}

export function selectCraftPicks(crafts = [], priceMap = {}, minItemProfit = 0, itemRarityMap = {}) {
  const safeMinProfit = Math.max(0, Number(minItemProfit) || 0)
  const safeCrafts = Array.isArray(crafts) ? crafts : []

  const allPicks = safeCrafts
    .map((craft) => {
      const totalKamas = calculateCraftExpectedKamas(craft, priceMap)
      return {
        itemId: Number(craft?.resultItemId),
        levelRequired: Number(craft?.levelRequired) || 0,
        count: 1,
        totalKamas,
        dropRate: 1,
        expectedItems: Math.max(1, Number(craft?.resultQuantity) || 1),
        totalSeconds: 0,
        rarity: itemRarityMap?.[craft?.resultItemId] ?? 0
      }
    })
    .filter((pick) => Number(pick.totalKamas) > 0)
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))

  const filtered = allPicks.filter((pick) => Number(pick.totalKamas) >= safeMinProfit)
  const [topPick, ...otherPicks] = filtered

  const primaryPick = topPick
    ? {
      ...topPick,
      isEligible: true,
      isAlternative: false
    }
    : null

  const alternatives = otherPicks.map((pick) => ({
    ...pick,
    isEligible: false,
    isAlternative: true
  }))

  return {
    primaryPick,
    picks: primaryPick ? [primaryPick, ...alternatives] : [],
    totalKamas: primaryPick ? (primaryPick.totalKamas || 0) : 0
  }
}

export function buildItemJobSkillIdsMap(harvestResources = [], crafts = []) {
  const itemJobSkillIdsMap = new Map()

  harvestResources.forEach((resource) => {
    const skillId = toPositiveInteger(resource?.jobSkillId)
    if (!skillId) return
    const loots = Array.isArray(resource?.loots) ? resource.loots : []
    loots.forEach((loot) => {
      const itemId = toPositiveInteger(loot?.itemId)
      if (!itemId) return
      if (!itemJobSkillIdsMap.has(itemId)) itemJobSkillIdsMap.set(itemId, new Set())
      itemJobSkillIdsMap.get(itemId).add(skillId)
    })
  })

  crafts.forEach((craft) => {
    const skillId = toPositiveInteger(craft?.jobId)
    const resultItemId = toPositiveInteger(craft?.resultItemId)
    if (!skillId) return
    
    // Map craft result items
    if (resultItemId) {
      if (!itemJobSkillIdsMap.has(resultItemId)) itemJobSkillIdsMap.set(resultItemId, new Set())
      itemJobSkillIdsMap.get(resultItemId).add(skillId)
    }
    
    // Map craft ingredient items to the same job
    const ingredients = Array.isArray(craft?.ingredients) ? craft.ingredients : []
    ingredients.forEach((ingredient) => {
      const ingredientItemId = toPositiveInteger(ingredient?.itemId)
      if (!ingredientItemId) return
      if (!itemJobSkillIdsMap.has(ingredientItemId)) itemJobSkillIdsMap.set(ingredientItemId, new Set())
      itemJobSkillIdsMap.get(ingredientItemId).add(skillId)
    })
  })

  return itemJobSkillIdsMap
}

export function getAllJobSkillIds(harvestResources = [], crafts = []) {
  const harvestSkillIds = harvestResources
    .map(resource => toPositiveInteger(resource?.jobSkillId))
    .filter(Boolean)

  const craftSkillIds = crafts
    .map(craft => toPositiveInteger(craft?.jobId))
    .filter(Boolean)

  return [...new Set([...harvestSkillIds, ...craftSkillIds])]
}