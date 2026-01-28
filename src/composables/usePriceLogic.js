import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useP2PStore } from '@/stores/useP2PStore'
import { useAppStore } from '@/stores/useAppStore'

/**
 * Composable pour gérer la logique unifiée des prix
 * Priorité : Prix personnel > Prix collectif (P2P)
 */
export function usePriceLogic() {
  const personalStore = usePersonalPricesStore()
  const p2pStore = useP2PStore()
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
    const collectivePrice = p2pStore.prices[server]?.[itemId]?.price || null
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

  return {
    getPrice,
    getCurrentPrice,
    hasPersonalPrice,
    hasCurrentPersonalPrice
  }
}
