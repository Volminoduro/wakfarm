import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import Gun from 'gun'
// import 'gun/lib/radisk' // Temporairement désactivé pour tester localStorage
import { inspectGunDB } from '@/utils/gunDebug'

export const useP2PStore = defineStore('p2p', {
  state: () => ({
    gun: null,
    machineID: null,
    prices: {},
    history: [],
    blacklist: [],
    isInitialized: false
  }),
  actions: {
    async init() {
      // Stratégie recommandée : Hybride avec stockage local + relay
      // - Stockage local IndexedDB pour la persistance
      // - Relay public pour aider à la synchronisation P2P
      this.gun = Gun({
        // peers: ['https://gun.1998.social/gun', 'https://peer.wallie.io/gun'], // Temporairement désactivé pour test local
        localStorage: true // Utilise localStorage pour tester
      })

      this.machineID = await this.generateMachineID()
      console.log('Machine ID (hashed MAC):', this.machineID)
      console.log('🔄 Gun.js initialized with localStorage + P2P relay')

      // Attendre un peu que Gun charge les données du stockage local
      setTimeout(() => {
        this.loadPrices()
        this.loadHistory()
        this.loadBlacklist()
        this.isInitialized = true
      }, 1000)
    },

    async generateMachineID() {
      try {
        const id = await invoke('get_machine_id')
        return id
      } catch (error) {
        console.error('Erreur génération ID:', error)
        return crypto.randomUUID()
      }
    },

    loadPrices() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }

      console.log('🔄 Loading prices from Gun...')
      this.gun.get('prices').on(data => {
        console.log('📦 Raw data received in loadPrices:', data)
        // Gun.js nous donne toutes les données, mais on doit extraire la version la plus récente pour chaque item
        const processedPrices = {}
        
        // Parcourir tous les serveurs
        Object.keys(data || {}).forEach(server => {
          if (server === '_') return // Ignorer les métadonnées Gun
          processedPrices[server] = {}
          
          // Pour chaque serveur, parcourir tous les items
          Object.keys(data[server] || {}).forEach(itemId => {
            if (itemId === '_') return // Ignorer les métadonnées Gun
            
            const itemData = data[server][itemId]
            
            // Si c'est un objet avec plusieurs versions, prendre la plus récente
            if (typeof itemData === 'object' && itemData !== null) {
              // Gun peut avoir plusieurs versions, trouver celle avec lastUpdated le plus récent
              let latestVersion = null
              let latestTimestamp = 0
              
              Object.keys(itemData).forEach(versionKey => {
                if (versionKey === '_') return
                const version = itemData[versionKey]
                if (version && version.lastUpdated && version.lastUpdated > latestTimestamp) {
                  latestVersion = version
                  latestTimestamp = version.lastUpdated
                }
              })
              
              if (latestVersion) {
                processedPrices[server][itemId] = latestVersion
              }
            } else {
              // Version simple (ancien format)
              processedPrices[server][itemId] = { price: itemData }
            }
          })
        })
        
        this.prices = processedPrices
        console.log('✅ Processed prices loaded:', processedPrices)
      })
    },

    updatePrice(server, itemId, newPrice) {
      // Vérifier que Gun est initialisé
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }

      const oldPrice = this.prices[server]?.[itemId]?.price || 0
      const update = {
        price: newPrice,
        lastUpdated: Date.now(),
        authorID: this.machineID
      }

      this.prices[server][itemId] = update

      // Envoyer à Gun pour synchronisation P2P
      console.log(`📤 Putting price to Gun: prices/${server}/${itemId}`, update)
      this.gun.get('prices').get(server).get(itemId).put(update)

      // Vérifier immédiatement si c'est stocké
      setTimeout(() => {
        this.gun.get('prices').get(server).get(itemId).once(data => {
          console.log(`🔍 Immediate check after put:`, data)
        })
      }, 100)

      // this.addToHistory(server, itemId, oldPrice, newPrice)
    },

    loadHistory() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }

      this.gun.get('history').on(data => {
        this.history = Array.isArray(data) ? data.slice(-1000) : []
      })
    },

    addToHistory(server, itemId, oldPrice, newPrice) {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }

      const entry = {
        timestamp: Date.now(),
        authorID: this.machineID,
        server,
        itemId,
        oldPrice,
        newPrice
      }
      this.gun.get('history').set(entry)
    },

    loadBlacklist() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }

      this.gun.get('blacklist').on(data => {
        this.blacklist = data?.blockedIDs || []
      })
    },

    loadHistory() {
      this.gun.get('history').on(data => {
        this.history = Array.isArray(data) ? data.slice(-1000) : []
      })
    },

    addToHistory(server, itemId, oldPrice, newPrice) {
      const entry = {
        timestamp: Date.now(),
        authorID: this.machineID,
        server,
        itemId,
        oldPrice,
        newPrice
      }
      this.gun.get('history').set(entry)
    },

    loadBlacklist() {
      this.gun.get('blacklist').on(data => {
        this.blacklist = data?.blockedIDs || []
      })
    },

    isBlocked(id) {
      return this.blacklist.includes(id)
    },

    // Debug function to inspect local Gun database content
    inspectLocalDB() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      inspectGunDB.inspectAll(this.gun)
    },

    // Debug function to inspect raw Gun database content
    inspectRawPrices() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      console.log('🔍 Inspecting RAW Gun prices data...')
      this.gun.get('prices').on(data => {
        console.log('Raw prices data from Gun (on):', data)
        if (!data || Object.keys(data).length === 0) {
          console.log('⚠️ No prices data found in Gun')
        }
      })
      // Also try map to see if it finds anything
      this.gun.get('prices').map().once((data, key) => {
        console.log(`Mapped prices data: key=${key}, data=`, data)
      })
    },

    // Debug function to inspect localStorage
    inspectLocalStorage() {
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage)
        console.log('🔍 All localStorage keys:', keys)
        keys.forEach(key => {
          if (key.startsWith('gun/') || key.includes('gun') || key.startsWith('Gun')) {
            console.log(`🔍 Gun key: ${key} =`, localStorage.getItem(key))
          }
        })
      } else {
        console.log('🔍 localStorage not available')
      }
    },

    // Debug function to clear all prices data
    clearAllPrices() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      console.log('🗑️ Clearing all prices data...')
      
      // Clear from Gun recursively - first delete all sub-nodes
      this.gun.get('prices').map().once((data, key) => {
        if (key && key !== '_') {
          console.log('🗑️ Clearing sub-key:', key)
          this.gun.get('prices').get(key).put(null)
        }
      })
      
      // Then delete the root after a delay
      setTimeout(() => {
        this.gun.get('prices').put(null)
        console.log('🗑️ Cleared prices root')
      }, 200)
      
      // Same for history and blacklist
      this.gun.get('history').put(null)
      this.gun.get('blacklist').put(null)
      
      // Also clear localStorage keys related to Gun (as per Stack Overflow suggestion)
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage)
        console.log('🗑️ All localStorage keys:', keys)
        keys.forEach(key => {
          if (key.startsWith('gun/') || key.includes('gun') || key.startsWith('Gun')) {
            localStorage.removeItem(key)
            console.log('🗑️ Cleared localStorage key:', key)
          }
        })
      }
      
      // Reset local state
      this.prices = {}
      this.history = []
      this.blacklist = []
    },

    // Specific inspections
    inspectPrices() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      inspectGunDB.inspectPrices(this.gun)
    },

    inspectHistory() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      inspectGunDB.inspectHistory(this.gun)
    },

    inspectBlacklist() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      inspectGunDB.inspectBlacklist(this.gun)
    },

    // Test Gun connectivity
    testConnectivity() {
      if (!this.gun) {
        console.error('❌ Gun.js not initialized')
        return
      }
      inspectGunDB.testConnectivity(this.gun)
    },

    // Switch between P2P modes (for development/testing)
    switchToPureP2P() {
      console.log('🔄 Switching to pure P2P mode (local storage only)...')
      this.gun = Gun({
        localStorage: false,
        store: true // IndexedDB seulement, pas de peers
      })
      this.reinitData()
    },

    switchToHybridP2P() {
      console.log('🔄 Switching to hybrid P2P mode (local + relay)...')
      this.gun = Gun({
        peers: ['https://gunjs.herokuapp.com/gun'],
        localStorage: false,
        store: true
      })
      this.reinitData()
    },

    switchToOnlineOnly() {
      console.log('🔄 Switching to online-only mode (relay only, no local storage)...')
      this.gun = Gun(['https://gunjs.herokuapp.com/gun'])
      this.reinitData()
    },

    // Reinitialize data loading after mode switch
    reinitData() {
      // Vider les données actuelles
      this.prices = {}
      this.history = []
      this.blacklist = []

      // Recharger depuis la nouvelle instance Gun
      this.loadPrices()
      this.loadHistory()
      this.loadBlacklist()
    }
  }
})