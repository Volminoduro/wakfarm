export function clampInteger(value, min = 0, max = 999, allowNull = true) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return allowNull ? null : min
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return allowNull ? null : min
  }

  return Math.min(max, Math.max(min, parsed))
}

export function calculateResourceExpectedKamas(resource, priceMap, bonusPercent = 0) {
  if (!resource || !Array.isArray(resource.loots)) return 0
  const quantityMultiplier = 1 + (Math.max(0, Number(bonusPercent) || 0) / 100)

  const total = resource.loots.reduce((sum, loot) => {
    const itemId = Number(loot.itemId)
    const dropRate = Math.max(0, Number(loot.dropRate) || 0)
    const expectedQuantity = (Number(loot.expectedQuantity) || 0) * quantityMultiplier
    const price = Number(priceMap[itemId]) || 0
    return sum + (dropRate * expectedQuantity * price)
  }, 0)

  return total
}

export function optimizeHarvestForTime(resources, totalSeconds) {
  const maxSeconds = Math.max(0, Number(totalSeconds) || 0)
  if (maxSeconds <= 0 || !Array.isArray(resources) || resources.length === 0) {
    return {
      totalKamas: 0,
      usedSeconds: 0,
      unusedSeconds: maxSeconds,
      picks: []
    }
  }

  const valid = resources
    .map((resource, index) => ({
      index,
      resource,
      timeCost: Math.max(0, Number(resource.actionSeconds) || 0),
      kamas: Math.max(0, Number(resource.expectedKamas) || 0)
    }))
    .filter(x => x.kamas > 0 && x.timeCost > 0 && x.timeCost <= maxSeconds)

  if (valid.length === 0) {
    return {
      totalKamas: 0,
      usedSeconds: 0,
      unusedSeconds: maxSeconds,
      picks: []
    }
  }

  const scale = getTimeScale(valid.map(x => x.timeCost))
  const maxUnits = Math.floor(maxSeconds * scale)
  const validScaled = valid.map(candidate => ({
    ...candidate,
    timeUnits: Math.max(1, Math.round(candidate.timeCost * scale))
  }))

  const dp = new Array(maxUnits + 1).fill(0)
  const choice = new Array(maxUnits + 1).fill(-1)

  for (let units = 1; units <= maxUnits; units += 1) {
    let bestValue = dp[units]
    let bestIndex = -1

    for (let i = 0; i < validScaled.length; i += 1) {
      const candidate = validScaled[i]
      if (candidate.timeUnits > units) continue
      const candidateValue = dp[units - candidate.timeUnits] + candidate.kamas
      if (candidateValue > bestValue) {
        bestValue = candidateValue
        bestIndex = i
      }
    }

    dp[units] = bestValue
    choice[units] = bestIndex
  }

  let bestUnits = 0
  for (let units = 1; units <= maxUnits; units += 1) {
    if (dp[units] > dp[bestUnits]) {
      bestUnits = units
    }
  }

  const pickCountByIndex = new Map()
  let cursor = bestUnits
  while (cursor > 0) {
    const candidateIndex = choice[cursor]
    if (candidateIndex < 0) break
    const candidate = validScaled[candidateIndex]
    pickCountByIndex.set(candidate.index, (pickCountByIndex.get(candidate.index) || 0) + 1)
    cursor -= candidate.timeUnits
  }

  const resourceByIndex = new Map(valid.map(entry => [entry.index, entry.resource]))

  const picks = Array.from(pickCountByIndex.entries())
    .map(([resourceIndex, count]) => ({
      resource: resourceByIndex.get(resourceIndex),
      count
    }))
    .filter(x => x.resource && x.count > 0)
    .map(({ resource, count }) => {
      const { dropRate, expectedQuantityPerAction } = getPrimaryLootStats(resource)
      const quantityMultiplier = Math.max(0, Number(resource.quantityMultiplier) || 1)
      const baseExpectedItems = expectedQuantityPerAction > 0
        ? expectedQuantityPerAction
        : dropRate
      const expectedItems = count * baseExpectedItems * quantityMultiplier
      const includeDetailedPickMetrics = resource.quantityMultiplier !== undefined
      
      return {
        itemId: resource.primaryItemId,
        count,
        ...(includeDetailedPickMetrics ? { dropRate, expectedItems } : {}),
        totalSeconds: count * Math.max(0.1, Number(resource.actionSeconds) || 0),
        totalKamas: count * Math.max(0, Number(resource.expectedKamas) || 0)
      }
    })
    .sort((a, b) => b.totalKamas - a.totalKamas)

  const usedSeconds = picks.reduce((sum, pick) => sum + pick.totalSeconds, 0)

  return {
    totalKamas: dp[bestUnits],
    usedSeconds,
    unusedSeconds: Math.max(0, maxSeconds - usedSeconds),
    picks
  }
}

function getTimeScale(timeCosts) {
  const maxDecimals = Math.min(
    2,
    timeCosts.reduce((max, value) => Math.max(max, countDecimals(value)), 0)
  )
  return 10 ** maxDecimals
}

function countDecimals(value) {
  const stringValue = String(value)
  if (!stringValue.includes('.')) return 0
  return stringValue.split('.')[1].length
}

function getPrimaryLootStats(resource) {
  const primaryItemId = Number(resource?.primaryItemId)
  const loots = Array.isArray(resource?.loots) ? resource.loots : []
  const primaryLoots = loots.filter(loot => Number(loot.itemId) === primaryItemId)

  const totalDropRate = primaryLoots.reduce(
    (sum, loot) => sum + Math.max(0, Number(loot.dropRate) || 0),
    0
  )
  const expectedQuantityPerAction = primaryLoots.reduce(
    (sum, loot) => sum + (Math.max(0, Number(loot.dropRate) || 0) * Math.max(0, Number(loot.expectedQuantity) || 0)),
    0
  )

  return {
    dropRate: totalDropRate > 0 ? Math.min(1, totalDropRate) : 1,
    expectedQuantityPerAction
  }
}
