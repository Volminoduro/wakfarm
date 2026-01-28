import { defineStore } from 'pinia'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useJsonStore } from '@/stores/useJsonStore'

export const usePersonalPricesStore = defineStore('personalPrices', {
  state: () => ({
    prices: {} // Format: { [server]: { [itemId]: { price: number, lastUpdated: timestamp } } }
  }),

  actions: {
    init() {
      this.loadFromLocalStorage()
    },

    loadFromLocalStorage() {
      const stored = localStorage.getItem(LS_KEYS.PERSONAL_PRICES)
      if (stored) {
        try {
          this.prices = JSON.parse(stored)
          console.log('✅ Personal prices loaded from localStorage:', this.prices)
        } catch (error) {
          console.error('❌ Error loading personal prices:', error)
          this.prices = {}
        }
      }
    },

    saveToLocalStorage() {
      localStorage.setItem(LS_KEYS.PERSONAL_PRICES, JSON.stringify(this.prices))
      console.log('💾 Personal prices saved to localStorage')
      try {
        const jsonStore = useJsonStore()
        // update pricesLastUpdate so other cached calculations invalidate
        jsonStore.pricesLastUpdate = Date.now()
      } catch (e) {
        console.warn('Could not update jsonStore.pricesLastUpdate from personal store', e)
      }
    },

    updatePrice(server, itemId, newPrice) {
      if (!this.prices[server]) {
        this.prices[server] = {}
      }

      if (newPrice === null || newPrice === undefined || newPrice === '') {
        // Supprimer le prix personnel
        delete this.prices[server][itemId]
        console.log(`🗑️ Removed personal price for ${server}/${itemId}`)
      } else {
        this.prices[server][itemId] = {
          price: parseInt(newPrice),
          lastUpdated: Date.now()
        }
        console.log(`💾 Updated personal price for ${server}/${itemId}: ${newPrice}`)
      }

      this.saveToLocalStorage()
    },

    getPrice(server, itemId) {
      return this.prices[server]?.[itemId]?.price || null
    },

    hasPersonalPrice(server, itemId) {
      return this.prices[server]?.[itemId] !== undefined
    },

    clearAll() {
      this.prices = {}
      this.saveToLocalStorage()
      console.log('🗑️ All personal prices cleared')
    },

    clearServer(server) {
      delete this.prices[server]
      this.saveToLocalStorage()
      console.log(`🗑️ Personal prices cleared for server: ${server}`)
    }
  }
})
