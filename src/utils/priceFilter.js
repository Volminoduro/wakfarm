/**
 * Vérifie si un prix est assez récent selon le filtre d'âge maximum
 * @param {number|undefined} lastUpdated - Timestamp du prix (ms)
 * @param {number|null} maxAgeDays - Âge maximum en jours (null = no limit)
 * @returns {boolean} true si le prix doit être inclus
 */
export function isPriceWithinAgeLimit(lastUpdated, maxAgeDays) {
  // No age filter = include all
  if (!maxAgeDays || maxAgeDays <= 0) {
    return true
  }

  // No timestamp = exclude
  if (!lastUpdated) {
    return false
  }

  const ageMs = Date.now() - lastUpdated
  const ageInDays = ageMs / (1000 * 60 * 60 * 24)

  return ageInDays <= maxAgeDays
}

/**
 * Filtre une price map pour exclure les prix trop anciens
 * Retourne seulement les prix numériques des entrées valides
 * @param {Object} priceMap - Map { itemId: { price, lastUpdated } | price }
 * @param {number|null} maxAgeDays - Âge maximum en jours
 * @returns {Object} Nouveau map { itemId: price } avec prix valides uniquement
 */
export function filterPricesByAge(priceMap, maxAgeDays) {
  if (!priceMap) {
    return {}
  }

  // If no age limit, return original map as-is
  if (!maxAgeDays || maxAgeDays <= 0) {
    return priceMap
  }

  const filtered = {}
  Object.entries(priceMap).forEach(([itemId, value]) => {
    // Handle both formats: { price: number, lastUpdated: timestamp } or just number
    let priceEntry, lastUpdated

    if (typeof value === 'object' && value !== null) {
      priceEntry = value.price
      lastUpdated = value.lastUpdated
    } else {
      priceEntry = value
      lastUpdated = undefined
    }

    if (isPriceWithinAgeLimit(lastUpdated, maxAgeDays)) {
      filtered[itemId] = priceEntry
    }
  })

  return filtered
}
