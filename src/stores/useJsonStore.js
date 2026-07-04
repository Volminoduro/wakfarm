import { defineStore } from 'pinia'
import axios from 'axios'
import { useAppStore } from './useAppStore'
import { usePersonalPricesStore } from './usePersonalPricesStore'
import { useCollectivePricesStore } from './useCollectivePricesStore'
import { isPriceWithinAgeLimit } from '@/utils/priceFilter'

export const useJsonStore = defineStore('data', {
  state: () => ({
    servers: [],
    loaded: false,
    pricesLastUpdate: null, // Used for cache invalidation when prices change
    _priceMapCache: { server: null, version: null, map: null },
    rawInstances: [],
    rawItems: [],
    planCraftMap: {},
    _rawMapping: [],
    _rawLoots: [],
    _bossMapping: {},
    rawHarvestResources: [],
    rawCrafts: [],
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
      const activeInstanceIds = new Set(
        (Array.isArray(this.rawInstances) ? this.rawInstances : [])
          .filter(instance => instance?.isActive !== false)
          .map(instance => instance.id)
      )

      if (loots.length === 0 || mapping.length === 0) return {}

      const monsterToInstances = new Map()
      mapping.forEach(m => {
        if (!activeInstanceIds.has(m.instanceId)) return
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
    * Récupère une map de prix avec priorité : personnel > collectif
     * Applique le filtre d'âge des prix si configuré
     * @param {string} server - Le serveur pour lequel récupérer les prix
     * @returns {Object} Map { itemId: price }
     */
    getPriceMapWithPersonal(server) {
      const personalStore = usePersonalPricesStore()
      const collectiveStore = useCollectivePricesStore()
      const appStore = useAppStore()
      const version = this.pricesLastUpdate || 0
      const serverKey = server || 'default'
      const maxAgeDays = appStore.config.maxPriceAgeDays

      if (
        this._priceMapCache &&
        this._priceMapCache.server === serverKey &&
        this._priceMapCache.version === version &&
        this._priceMapCache.maxAgeDays === maxAgeDays &&
        this._priceMapCache.map
      ) {
        return this._priceMapCache.map
      }
      
      // Gather all items that have prices (with age filtering)
      const itemIds = new Set()
      
      // Add items with personal prices (highest priority)
      if (personalStore.prices[server]) {
        Object.keys(personalStore.prices[server]).forEach(id => {
          const priceEntry = personalStore.prices[server][id]
          if (isPriceWithinAgeLimit(priceEntry.lastUpdated, maxAgeDays)) {
            itemIds.add(id)
          }
        })
      }
      
      // Add items with collective prices (fallback, only if not already personal)
      if (collectiveStore.prices[server]) {
        Object.keys(collectiveStore.prices[server]).forEach(id => {
          if (!itemIds.has(id)) {
            const priceEntry = collectiveStore.prices[server][id]
            if (isPriceWithinAgeLimit(priceEntry.lastUpdated, maxAgeDays)) {
              itemIds.add(id)
            }
          }
        })
      }
      
      // Create unified map (personal > collective)
      const unifiedMap = {}
      itemIds.forEach(itemId => {
        // Try personal price first (highest priority)
        if (personalStore.prices[server] && personalStore.prices[server][itemId]) {
          unifiedMap[itemId] = personalStore.prices[server][itemId].price
        }
        // Fall back to collective price (lowest priority)
        else if (collectiveStore.prices[server] && collectiveStore.prices[server][itemId]) {
          unifiedMap[itemId] = collectiveStore.prices[server][itemId].price
        }
      })

      this._priceMapCache = { server: serverKey, version, maxAgeDays, map: unifiedMap }
      return unifiedMap
    },

    async loadAllData(server) {
      try {
        const basePath = import.meta.env.BASE_URL
        
        // Load critical data first (items + instances)
        const [itemRes, instRes] = await Promise.all([
          axios.get(`${basePath}data/items.json`),
          axios.get(`${basePath}data/instances.json`)
        ])
        
        this.rawItems = itemRes.data
        this.rawInstances = instRes.data

        // Mark as loaded after Phase 1 — views can render while Phase 2 loads in background
        this.loaded = true

        // Phase 2a : petits fichiers (rapides, débloquent les vues serveurs/instances)
        try {
          const [mappingRes, serversRes, bossMappingRes, planCraftMappingRes] = await Promise.all([
            axios.get(`${basePath}data/mapping.json`),
            axios.get(`${basePath}data/servers.json`),
            axios.get(`${basePath}data/boss-mapping.json`),
            axios.get(`${basePath}data/plan-craft-mapping.json`)
              .catch(() => ({ data: {} }))
          ])
          this.servers = serversRes.data || []
          this._rawMapping = mappingRes.data
          this._bossMapping = bossMappingRes.data
          this.planCraftMap = planCraftMappingRes.data && typeof planCraftMappingRes.data === 'object'
            ? planCraftMappingRes.data
            : {}
          this.rawInstances = this.rawInstances.map(inst => ({
            ...inst,
            bossId: this._bossMapping[inst.id] || null
          }))
        } catch (e) {
          console.error('⚠️ Error loading Phase 2a data:', e)
        }

        // Phase 2b : gros fichiers différés (loots 1.3 MB + crafts 1.8 MB)
        // setTimeout(0) laisse le navigateur rendre l'UI de Phase 2a avant de parser ces fichiers
        setTimeout(async () => {
          try {
            const [lootRes, harvestResourcesRes, craftsRes] = await Promise.all([
              axios.get(`${basePath}data/loots.json`),
              axios.get(`${basePath}data/harvest.json`)
                .catch(() => axios.get(`${basePath}data/harvest-resources.json`))
                .catch(() => ({ data: { resources: [] } })),
              axios.get(`${basePath}data/crafts.json`)
                .catch(() => ({ data: { crafts: [] } }))
            ])
            this._rawLoots = lootRes.data
            this.rawHarvestResources = Array.isArray(harvestResourcesRes.data?.resources)
              ? harvestResourcesRes.data.resources
              : []
            this.rawCrafts = Array.isArray(craftsRes.data?.crafts)
              ? craftsRes.data.crafts
              : []
            this._initiateInstancesBase()
          } catch (e) {
            console.error('⚠️ Error loading Phase 2b data:', e)
          }
        }, 0)
      } catch (e) {
        console.error("❌ Error loading data:", e)
        this.loaded = true // unblock the UI even if critical data failed
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
