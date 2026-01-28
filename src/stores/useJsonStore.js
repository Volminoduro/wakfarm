import { defineStore } from 'pinia'
import axios from 'axios'
import { useAppStore } from './useAppStore'
import { watch } from 'vue'
import { usePriceLogic } from '@/composables/usePriceLogic'
import { usePersonalPricesStore } from './usePersonalPricesStore'
import { useLocalCollectivePricesStore } from './useLocalCollectivePricesStore'

export const useJsonStore = defineStore('data', {
  state: () => ({
    servers: [],
    loaded: false,
    pricesLastUpdate: null, // Used for cache invalidation when prices change
    rawInstances: [],
    rawItems: [],
    _rawMapping: [],
    _rawLoots: [],
    _bossMapping: {},
    _hasConfigWatcher: false,
    instancesBase: []
  }),
  getters: {
    itemRarityMap() {
      const map = {}
      if (Array.isArray(this.rawItems)) {
        this.rawItems.forEach(item => {
          map[item.id] = item.rarity || 0
        })
      }
      return map
    },

    itemToInstancesMap() {
      const loots = Array.isArray(this._rawLoots) ? this._rawLoots : []
      const mapping = Array.isArray(this._rawMapping) ? this._rawMapping : []

      if (loots.length === 0 || mapping.length === 0) return {}

      const monsterToInstances = new Map()
      mapping.forEach(m => {
        const monsters = Array.isArray(m && m.monsters) ? m.monsters : []
        monsters.forEach(monster => {
          const existing = monsterToInstances.get(monster.monsterId) || []
          existing.push(m.instanceId)
          monsterToInstances.set(monster.monsterId, existing)
        })
      })

      const itemMap = new Map()
      loots.forEach(loot => {
        const instanceIds = monsterToInstances.get(loot.monsterId) || []
        const lootList = Array.isArray(loot && loot.loots) ? loot.loots : []
        lootList.forEach(drop => {
          const existing = itemMap.get(drop.itemId) || new Set()
          instanceIds.forEach(instId => existing.add(instId))
          itemMap.set(drop.itemId, existing)
        })
      })

      const result = {}
      itemMap.forEach((instanceSet, itemId) => {
        result[itemId] = Array.from(instanceSet)
      })
      return result
    }
  },
  actions: {
    /**
     * Récupère une map de prix avec priorité : personnel > collectif (P2P)
     * @param {string} server - Le serveur pour lequel récupérer les prix
     * @returns {Object} Map { itemId: price }
     */
    getPriceMapWithPersonal(server) {
      const personalStore = usePersonalPricesStore()
      const collectiveStore = useLocalCollectivePricesStore()
      
      // Gather all items that have prices
      const itemIds = new Set()
      
      // Add items with personal prices (highest priority)
      if (personalStore.prices[server]) {
        Object.keys(personalStore.prices[server]).forEach(id => itemIds.add(id))
      }
      
      // Add items with local collective prices (fallback)
      if (collectiveStore.prices[server]) {
        Object.keys(collectiveStore.prices[server]).forEach(id => itemIds.add(id))
      }
      
      // Create unified map (personal > collective)
      const unifiedMap = {}
      itemIds.forEach(itemId => {
        // Try personal price first
        if (personalStore.prices[server] && personalStore.prices[server][itemId]) {
          unifiedMap[itemId] = personalStore.prices[server][itemId].price
        }
        // Fall back to collective price
        else if (collectiveStore.prices[server] && collectiveStore.prices[server][itemId]) {
          unifiedMap[itemId] = collectiveStore.prices[server][itemId].price
        }
      })
      
      return unifiedMap
    },

    async loadAllData(server) {
      try {
        const basePath = import.meta.env.BASE_URL
        
        // **PHASE 1: Load critical data first (items + instances)**
        console.log('📦 Phase 1: Loading items and instances...')
        const [itemRes, instRes] = await Promise.all([
          axios.get(`${basePath}data/items.json`),
          axios.get(`${basePath}data/instances.json`)
        ])
        
        this.rawItems = itemRes.data
        this.rawInstances = instRes.data
        console.log('✅ Items and instances loaded')
        
        // **PHASE 2: Load remaining data in background (non-blocking)**
        console.log('📦 Phase 2: Loading mapping, loots, servers, boss-mapping (background)...')
        Promise.all([
          axios.get(`${basePath}data/mapping.json`),
          axios.get(`${basePath}data/loots.json`),
          axios.get(`${basePath}data/servers.json`),
          axios.get(`${basePath}data/boss-mapping.json`)
        ]).then(([mappingRes, lootRes, serversRes, bossMappingRes]) => {
          this.servers = serversRes.data || []
          this._rawMapping = mappingRes.data
          this._rawLoots = lootRes.data
          this._bossMapping = bossMappingRes.data
          
          this.rawInstances = this.rawInstances.map(inst => ({
            ...inst,
            bossId: this._bossMapping[inst.id] || null
          }))
          
          this._initiateInstancesBase()
          console.log('✅ Phase 2 completed: mapping, loots, servers, boss-mapping loaded')
        }).catch(e => {
          console.error('⚠️ Error loading Phase 2 data (non-critical):', e)
        })
        
        // **Setup watcher for server changes**
        const appStore = useAppStore()
        if (!this._hasConfigWatcher) {
          this._hasConfigWatcher = true
          watch(
            () => appStore.config.server,
            async (newServer, oldServer) => {
              if (newServer !== oldServer) {
                console.log(`📍 Server changed from ${oldServer} to ${newServer}`)
              }
            }
          )
        }
        
        // Mark as loaded after Phase 1
        this.loaded = true
        console.log('✨ Store ready for UI (Phase 1 complete)')
      } catch (e) {
        console.error("❌ Erreur chargement données Phase 1", e)
      }
    },

    _initiateInstancesBase(){
      // Préparer un mapping instanceId -> mapping
      const mappingMap = new Map(this._rawMapping.map(m => [m.instanceId, m]))

      // Préparer un mapping monsterId -> loots
      const lootMap = new Map()
      this._rawLoots.forEach(loot => {
        lootMap.set(loot.monsterId, loot.loots || [])
      })

      // Construction optimisée des instances
      // Ignore instances explicitly marked as inactive (isActive: false)
      const rawInstancesFiltered = Array.isArray(this.rawInstances)
        ? this.rawInstances.filter(inst => inst.isActive !== false)
        : []

      const instancesBase = rawInstancesFiltered.map(inst => {
        const instanceMapping = mappingMap.get(inst.id)
        let baseLoots = []
        if (instanceMapping?.monsters) {
          baseLoots = instanceMapping.monsters.flatMap(monster => {
            const monsterLoots = lootMap.get(monster.monsterId) || []
            return monsterLoots.map(lootEntry => ({
              ...lootEntry,
              monsterQuantity: monster.number || 1
            }))
          })
        }
        const players = inst.players || (inst.isDungeon ? 3 : 4)
        return {
          id: inst.id,
          level: inst.level,
          isDungeon: inst.isDungeon,
          isUltimate: inst.isUltimate || false,
          bossId: inst.bossId || null,
          loots: baseLoots,
          players
        }
      })
      this.instancesBase = instancesBase
    }
  }
})
