export const RARITY_MAP = {
  0: 'rarity_common',
  1: 'rarity_unusual',
  2: 'rarity_rare',
  3: 'rarity_mythical',
  4: 'rarity_legendary',
  5: 'rarity_relic',
  6: 'rarity_souvenir',
  7: 'rarity_epic'
}

export function getRarityKey(index) {
  return RARITY_MAP[index] || 'rarity_common'
}

export function getRarityName(t, index) {
  const key = getRarityKey(index)
  return t('divers.' + key)
}
