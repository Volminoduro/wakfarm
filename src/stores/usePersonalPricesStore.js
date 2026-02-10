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
        } catch (error) {
          console.error('❌ Error loading personal prices:', error)
          this.prices = {}
        }
      }
    },

    saveToLocalStorage() {
      localStorage.setItem(LS_KEYS.PERSONAL_PRICES, JSON.stringify(this.prices))
      try {
        const jsonStore = useJsonStore()
        jsonStore.pricesLastUpdate = Date.now()
      } catch (e) {
        // Silent fail - non-critical
      }
    },

    updatePrice(server, itemId, newPrice) {
      if (!this.prices[server]) {
        this.prices[server] = {}
      }

      if (newPrice === null || newPrice === undefined || newPrice === '') {
        delete this.prices[server][itemId]
      } else {
        this.prices[server][itemId] = {
          price: parseInt(newPrice),
          lastUpdated: Date.now()
        }
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
    },

    clearServer(server) {
      delete this.prices[server]
      this.saveToLocalStorage()
    }
  }
})
