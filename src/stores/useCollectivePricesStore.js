import { defineStore } from 'pinia'
import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  getDoc
} from 'firebase/firestore'
import {
  getAuth,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { useAlertsStore } from '@/stores/useAlertsStore'
import { useJsonStore } from '@/stores/useJsonStore'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Anonymous auth + whitelist (no password needed)

// Initialize Firebase
let app
let db
let auth

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
} catch (err) {
  console.error('❌ Firebase init failed:', err)
}

// Helper to get list of servers from jsonStore
function getServerList() {
  try {
    const jsonStore = useJsonStore()
    if (jsonStore.servers && Array.isArray(jsonStore.servers)) {
      return jsonStore.servers.map(s => s.id)
    }
  } catch (e) {
    // Fallback if jsonStore not available yet
  }
  // Fallback list
  return ['pandora', 'rubilax', 'ogrest', 'neo-pandora', 'neo-rubilax', 'neo-ogrest']
}

function bumpPricesVersion() {
  try {
    const jsonStore = useJsonStore()
    jsonStore.pricesLastUpdate = Date.now()
  } catch (e) {
    // Silent fail - non-critical
  }
}

export const useCollectivePricesStore = defineStore('collectivePrices', {
  state: () => ({
    prices: {},
    isInitialized: false,
    isAuthenticated: false,
    isLocalUpdate: false,
    machineID: null,
    userID: null,
    appVersion: null,
    authError: null,
    isBlacklisted: false,
    blacklistType: null,
    readPermissionDeniedShown: false
  }),

  actions: {
    async init() {
      if (!db || !auth) {
        console.error('❌ Firebase not initialized')
        return
      }

      try {
        // Get machine ID to ensure consistent auth across builds
        this.machineID = await invoke('get_machine_id')
      } catch (err) {
        console.error('❌ Failed to get machine ID:', err)
        // Continue without machine ID (fallback to standard anonymous auth)
      }

      try {
        this.appVersion = await getVersion()
      } catch (err) {
        console.warn('⚠️ Could not get app version:', err)
        this.appVersion = null
      }

      // Configure Firebase Auth persistence
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (err) {
        console.warn('⚠️ Could not set auth persistence:', err)
      }

      // Try to restore existing authentication or create new one
      const authenticated = await this.authenticateWithMachineID()
      
      if (authenticated) {
        // Map Firebase UID to machine ID for rules lookups
        await this.ensureClientMapping()
        // Auto-whitelist on first connection
        await this.ensureWhitelisted()
        // Check blacklist status
        await this.checkBlacklistStatus()
        await this.loadPrices()
        this.isInitialized = true
      } else {
        console.error('❌ Authentication failed')
        this.authError = 'Authentication failed'
      }
    },

    async authenticateWithMachineID() {
      try {
        // Sign in anonymously with Firebase Auth (for permissions)
        const userCred = await signInAnonymously(auth)
        const firebaseUID = userCred.user.uid
        
        // Use machine ID as authorID for consistent identification
        // Firebase UID can change, but machine ID remains constant per machine
        this.userID = firebaseUID // Keep for Firebase Auth
        this.isAuthenticated = true
        
        return true
      } catch (error) {
        console.error('❌ Auth failed:', error.message)
        this.isAuthenticated = false
        this.authError = error.message
        return false
      }
    },

    async ensureClientMapping() {
      if (!this.userID || !this.machineID || !db) return

      try {
        await setDoc(
          doc(db, 'client_ids', this.userID),
          {
            machineID: this.machineID,
            appVersion: this.appVersion || 'unknown',
            updatedAt: Date.now()
          },
          { merge: true }
        )
      } catch (error) {
        console.error('❌ client_ids mapping error:', error)
      }
    },

    async ensureWhitelisted() {
      if (!this.machineID || !db) return

      try {
        // Use machine ID for whitelist/blacklist to ensure consistency
        const snap = await getDoc(doc(db, 'allowlist', this.machineID))
        
        if (!snap.exists()) {
          await setDoc(doc(db, 'allowlist', this.machineID), {
            createdAt: Date.now(),
            appVersion: this.appVersion || 'unknown',
            firebaseUID: this.userID // Store Firebase UID for reference
          })
        }
      } catch (error) {
        console.error('❌ Whitelist error:', error)
      }
    },

    async checkBlacklistStatus() {
      if (!this.machineID || !db) return

      try {
        // Use machine ID for blacklist checks
        const readBlacklistDoc = await getDoc(doc(db, 'blacklist_read', this.machineID))
        const writeBlacklistDoc = await getDoc(doc(db, 'blacklist_write', this.machineID))

        if (readBlacklistDoc.exists()) {
          this.isBlacklisted = true
          this.blacklistType = 'read'
          console.warn('⚠️ User READ-blacklisted')
        } else if (writeBlacklistDoc.exists()) {
          this.isBlacklisted = true
          this.blacklistType = 'write'
          console.warn('⚠️ User WRITE-blacklisted')
        } else {
          this.isBlacklisted = false
          this.blacklistType = null
        }
      } catch (error) {
        console.error('❌ Blacklist check error:', error)
      }
    },

    async loadPrices() {
      if (!db) {
        console.error('❌ Firebase not initialized')
        return
      }

      if (!this.isAuthenticated) {
        console.error('❌ Not authenticated')
        return
      }

      // Check if user is blacklisted for reading
      if (this.isBlacklisted && this.blacklistType === 'read') {
        const alertsStore = useAlertsStore()
        alertsStore.addAlert('danger', 'alert_blacklist_read', {}, 0)
        console.warn('⚠️ Read blocked: user is read-blacklisted')
        return
      }
      
      try {
        const servers = getServerList()
        const allPrices = {}
        
        await Promise.all(servers.map(async (server) => {
          try {
            const collectionName = `collective_prices_${server.toLowerCase()}`
            const pricesCollectionRef = collection(db, collectionName)
            const snapshot = await getDocs(pricesCollectionRef)
            
            allPrices[server] = {}
            snapshot.forEach(doc => {
              const data = doc.data()
              allPrices[server][String(doc.id)] = data
            })
          } catch (err) {
            if (!this.readPermissionDeniedShown && err?.code === 'permission-denied') {
              const alertsStore = useAlertsStore()
              alertsStore.addAlert('danger', 'alert_blacklist_read', {}, 0)
              this.readPermissionDeniedShown = true
            }
            // Collection might not exist yet
            allPrices[server] = {}
          }
        }))

        this.prices = allPrices
        bumpPricesVersion()
        this.subscribeToAllPrices()
      } catch (err) {
        console.error('❌ Error loading prices:', err)
      }
    },

    subscribeToAllPrices() {
      if (!db) return

      // Check if user is blacklisted for reading
      if (this.isBlacklisted && this.blacklistType === 'read') {
        console.warn('⚠️ Real-time read blocked: user is read-blacklisted')
        return
      }
      
      const servers = getServerList()
      servers.forEach(server => {
        try {
          const collectionName = `collective_prices_${server.toLowerCase()}`
          const pricesCollectionRef = collection(db, collectionName)
          
          onSnapshot(pricesCollectionRef, (snapshot) => {
            if (!this.prices[server]) {
              this.prices[server] = {}
            }
            
            snapshot.forEach(doc => {
              const data = doc.data()
              
              if (this.isLocalUpdate) {
                return
              }

              const docId = String(doc.id)
              const existing = this.prices[server][docId]
              if (!existing || data.lastUpdated > existing.lastUpdated) {
                this.prices[server][docId] = data
              }
            })

            this.prices = { ...this.prices }
            bumpPricesVersion()
          }, (err) => {
            if (!this.readPermissionDeniedShown && err?.code === 'permission-denied') {
              const alertsStore = useAlertsStore()
              alertsStore.addAlert('danger', 'alert_blacklist_read', {}, 0)
              this.readPermissionDeniedShown = true
            }
            console.error(`❌ Firebase listener error for ${server}:`, err)
          })
        } catch (err) {
          // Collection might not exist
        }
      })
    },

    async updatePrice(server, itemId, newPrice) {
      if (!db) {
        console.error('❌ Firebase not initialized')
        return false
      }

      if (!this.isAuthenticated) {
        console.error('❌ Not authenticated')
        return false
      }

      // Check if user is blacklisted for writing
      if (this.isBlacklisted && this.blacklistType === 'write') {
        const alertsStore = useAlertsStore()
        alertsStore.addAlert('warning', 'alert_blacklist_write', {}, 5000)
        console.warn('⚠️ Write blocked: user is write-blacklisted')
        return false
      }

      if (!this.prices[server]) {
        this.prices[server] = {}
      }

      const oldPrice = this.prices[server]?.[itemId]?.price || null
      
      if (newPrice === oldPrice) {
        return true
      }

      const update = {
        price: newPrice,
        lastUpdated: Date.now(),
        authorID: this.machineID, // Use machine ID for consistent author identification
        itemId: itemId
      }

      this.isLocalUpdate = true

      const newServerData = { ...this.prices[server], [itemId]: update }
      this.prices[server] = newServerData
      this.prices = { ...this.prices }

      try {
        const collectionName = `collective_prices_${server.toLowerCase()}`
        const docRef = doc(db, collectionName, String(itemId))
        await setDoc(docRef, update)
        
        // Also add to price_history for audit trail
        await this.addPriceHistory(server, itemId, oldPrice, newPrice)
        bumpPricesVersion()
        return true
      } catch (err) {
        console.error('❌ Error updating price:', err)
        // Show alert for write failure
        const alertsStore = useAlertsStore()
        if (err.message && err.message.includes('permission')) {
          alertsStore.addAlert('danger', 'alert_blacklist_write', {}, 5000)
        } else {
          alertsStore.addAlert('danger', 'alert_update_price_error', {}, 5000)
        }
        return false
      } finally {
        setTimeout(() => {
          this.isLocalUpdate = false
        }, 500)
      }
    },

    async addPriceHistory(server, itemId, oldPrice, newPrice) {
      if (!db) return

      try {
        const historyEntry = {
          itemId: String(itemId),
          oldPrice,
          newPrice,
          timestamp: Date.now(),
          authorID: this.machineID // Use machine ID for consistent author identification
        }

        const collectionName = `price_history_${server.toLowerCase()}`
        const historyRef = collection(db, collectionName)
        const docId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await setDoc(doc(historyRef, docId), historyEntry)
      } catch (err) {
        console.error('❌ Error adding to history:', err)
      }
    },

    async clearAllPrices() {
      if (!db) {
        console.error('❌ Firebase not initialized')
        return
      }

      if (!this.isAuthenticated) {
        console.error('❌ Not authenticated')
        return
      }
      
      try {
        const servers = getServerList()
        
        await Promise.all(servers.map(async (server) => {
          try {
            const collectionName = `collective_prices_${server.toLowerCase()}`
            const pricesCollectionRef = collection(db, collectionName)
            const snapshot = await getDocs(pricesCollectionRef)
            
            const deletePromises = snapshot.docs.map(docSnap =>
              deleteDoc(doc(db, collectionName, docSnap.id))
            )
            
            await Promise.all(deletePromises)
          } catch (err) {
            // Collection might not exist
          }
        }))
        
        this.prices = {}
        bumpPricesVersion()
      } catch (err) {
        console.error('❌ Error clearing prices:', err)
      }
    }
  }
})
