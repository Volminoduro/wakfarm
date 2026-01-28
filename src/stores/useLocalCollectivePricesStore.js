import { defineStore } from 'pinia'
import { LS_KEYS } from '@/constants/localStorageKeys'

/**
 * Local collective prices store — stores community prices locally
 * without P2P sync (yet). Prices are shared by aggregate/voting
 * from multiple users in a future version.
 *
 * Structure: { [server]: { [itemId]: { price: number, lastUpdated: timestamp, votes: number } } }
 */
export const useLocalCollectivePricesStore = defineStore('localCollectivePrices', {
  state: () => ({
    prices: {} // Format: { [server]: { [itemId]: { price: number, lastUpdated: timestamp, votes: number } } }
  }),

  actions: {
    init() {
      this.loadFromLocalStorage()
    },

    loadFromLocalStorage() {
      const stored = localStorage.getItem(LS_KEYS.LOCAL_COLLECTIVE_PRICES)
      if (stored) {
        try {
          this.prices = JSON.parse(stored)
          console.log('✅ Local collective prices loaded from localStorage:', this.prices)
        } catch (error) {
          console.error('❌ Error loading local collective prices:', error)
          this.prices = {}
        }
      }
    },

    saveToLocalStorage() {
      localStorage.setItem(LS_KEYS.LOCAL_COLLECTIVE_PRICES, JSON.stringify(this.prices))
      console.log('💾 Local collective prices saved to localStorage')
    },

    updatePrice(server, itemId, newPrice) {
      if (!this.prices[server]) {
        this.prices[server] = {}
      }

      if (newPrice === null || newPrice === undefined || newPrice === '') {
        // Delete the collective price
        delete this.prices[server][itemId]
        console.log(`🗑️ Removed collective price for ${server}/${itemId}`)
      } else {
        this.prices[server][itemId] = {
          price: parseFloat(newPrice),
          lastUpdated: Date.now(),
          votes: (this.prices[server][itemId]?.votes || 0) + 1
        }
        console.log(`🔄 Updated collective price for ${server}/${itemId}: ${newPrice}`)
      }

      this.saveToLocalStorage()

      // Invalidate cache when prices change
      try {
        const { useJsonStore } = require('@/stores/useJsonStore')
        const jsonStore = useJsonStore()
        jsonStore.pricesLastUpdate = Date.now()
      } catch (e) {
        console.warn('Could not update jsonStore.pricesLastUpdate from local collective store', e)
      }
    },

    clearAll() {
      this.prices = {}
      localStorage.removeItem(LS_KEYS.LOCAL_COLLECTIVE_PRICES)
      console.log('🗑️ All local collective prices cleared')
      
      // Invalidate cache
      try {
        const { useJsonStore } = require('@/stores/useJsonStore')
        const jsonStore = useJsonStore()
        jsonStore.pricesLastUpdate = Date.now()
      } catch (e) {
        console.warn('Could not update jsonStore.pricesLastUpdate', e)
      }
    },

    clearServer(server) {
      if (this.prices[server]) {
        delete this.prices[server]
        this.saveToLocalStorage()
        console.log(`🗑️ Local collective prices cleared for server: ${server}`)
      }
    }
  }
})
