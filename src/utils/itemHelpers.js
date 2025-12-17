
/**
 * Get stele information string for an item
 * @param {Object} item - Item with stele and steleIntervention properties
 * @returns {string} Formatted stele info (e.g., ", st. 2, st.i. 1") or empty string
 */
export function getSteleInfo(item) {
  const parts = []
  if (item.stele > 0) {
    parts.push(`st. ${item.stele}`)
  }
  if (item.steleIntervention > 0) {
    parts.push(`st.i. ${item.steleIntervention}`)
  }
  return parts.length > 0 ? ', ' + parts.join(', ') : ''
}

/**
 * Get Tailwind class for rarity color
 * @param {number} rarity
 * @returns {string} Tailwind text color class (e.g. 'text-rarity-2')
 */
export function getRarityClass(rarity) {
  const idx = (typeof rarity === 'number' && rarity >= 0 && rarity <= 7) ? rarity : 0
  return `text-rarity-${idx}`
}
