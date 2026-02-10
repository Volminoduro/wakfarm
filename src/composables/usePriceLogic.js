import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useCollectivePricesStore } from '@/stores/useCollectivePricesStore'
import { useAppStore } from '@/stores/useAppStore'

/**
 * Composable pour gérer la logique unifiée des prix
 * Priorité : Prix personnel > Prix collectif
 */
export function usePriceLogic() {
  const personalStore = usePersonalPricesStore()
  const collectiveStore = useCollectivePricesStore()
  const appStore = useAppStore()

  /**
   * Récupère le prix d'un item avec priorité : personnel > collectif
   * @param {string} server - Le serveur
   * @param {number|string} itemId - L'ID de l'item
   * @returns {{ price: number|null, isPersonal: boolean }} - Le prix et si c'est un prix personnel
   */
  function getPrice(server, itemId) {
    // Vérifier d'abord les prix personnels
    const personalPrice = personalStore.getPrice(server, itemId)
    if (personalPrice !== null) {
      return {
        price: personalPrice,
        isPersonal: true
      }
    }

    // Sinon, utiliser le prix collectif
    const collectivePrice = collectiveStore.prices[server]?.[itemId]?.price || null
    return {
      price: collectivePrice,
      isPersonal: false
    }
  }

  /**
   * Récupère le prix pour le serveur actuel
   * @param {number|string} itemId - L'ID de l'item
   * @returns {{ price: number|null, isPersonal: boolean }}
   */
  function getCurrentPrice(itemId) {
    return getPrice(appStore.config.server, itemId)
  }

  /**
   * Vérifie si un item a un prix personnel
   * @param {string} server - Le serveur
   * @param {number|string} itemId - L'ID de l'item
   * @returns {boolean}
   */
  function hasPersonalPrice(server, itemId) {
    return personalStore.hasPersonalPrice(server, itemId)
  }

  /**
   * Vérifie si un item a un prix personnel pour le serveur actuel
   * @param {number|string} itemId - L'ID de l'item
   * @returns {boolean}
   */
  function hasCurrentPersonalPrice(itemId) {
    return hasPersonalPrice(appStore.config.server, itemId)
  }

  /**
   * Récupère le timestamp de dernière modification d'un prix
   * @param {string} server - Le serveur
   * @param {number|string} itemId - L'ID de l'item
   * @returns {number|null} - Timestamp en millisecondes, ou null si pas de prix
   */
  function getPriceLastUpdated(server, itemId) {
    // Vérifier d'abord les prix personnels
    const personalPriceData = personalStore.prices[server]?.[itemId]
    if (personalPriceData && personalPriceData.lastUpdated) {
      return personalPriceData.lastUpdated
    }

    // Sinon, utiliser le timestamp du prix collectif
    const collectivePriceData = collectiveStore.prices[server]?.[itemId]
    if (collectivePriceData && collectivePriceData.lastUpdated) {
      return collectivePriceData.lastUpdated
    }

    return null
  }

  /**
   * Récupère le timestamp de dernière modification pour le serveur actuel
   * @param {number|string} itemId - L'ID de l'item
   * @returns {number|null}
   */
  function getCurrentPriceLastUpdated(itemId) {
    return getPriceLastUpdated(appStore.config.server, itemId)
  }

  /**
   * Formate un timestamp en string lisible (ex: "28.01.2026 14:30")
   * @param {number} timestamp - Timestamp en millisecondes
   * @returns {string}
   */
  function formatTimestamp(timestamp) {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  return {
    getPrice,
    getCurrentPrice,
    hasPersonalPrice,
    hasCurrentPersonalPrice,
    getPriceLastUpdated,
    getCurrentPriceLastUpdated,
    formatTimestamp
  }
}
