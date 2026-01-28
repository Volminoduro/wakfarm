// Utility functions for inspecting Gun.js database
export const inspectGunDB = {
  // Inspect all data in the Gun instance
  inspectAll(gun) {
    console.log('🔍 Inspecting Gun.js Database...')

    // Check storage configuration
    console.log('💾 Storage config:', {
      localStorage: gun._.opt.localStorage,
      store: gun._.opt.store,
      peers: gun._.opt.peers
    })

    // Try different approaches to inspect data
    console.log('📊 Current Gun instance:', gun)
    console.log('🌐 Gun peers:', gun._.opt.peers)

    // Check IndexedDB directly if available
    if (typeof indexedDB !== 'undefined') {
      console.log('🗄️ IndexedDB is available')
      // List all Gun-related databases
      indexedDB.databases().then(dbs => {
        const gunDBs = dbs.filter(db => db.name && db.name.includes('gun'))
        console.log('🔍 Gun databases in IndexedDB:', gunDBs)
      }).catch(err => console.log('❌ Could not list IndexedDB databases:', err))
    }

    // Get all root keys - try multiple methods
    gun.map().once((data, key) => {
      if (key && key !== '_') {
        console.log(`📁 Root key found: ${key}`)
        this.inspectNode(gun.get(key), key, 1)
      }
    })

    // Also try direct access to known keys
    setTimeout(() => {
      console.log('⏰ Delayed inspection (2s)...')
      gun.get('prices').once(data => {
        console.log('💰 Direct prices access:', data)
      })
      gun.get('history').once(data => {
        console.log('📜 Direct history access:', data)
      })
      gun.get('blacklist').once(data => {
        console.log('🚫 Direct blacklist access:', data)
      })
    }, 2000)
  },

  // Recursively inspect a node
  inspectNode(node, path = '', depth = 0) {
    const indent = '  '.repeat(depth)

    node.once((data, key) => {
      if (typeof data === 'object' && data !== null) {
        console.log(`${indent}📂 ${path || key}:`, data)

        // Inspect children if not too deep
        if (depth < 3) {
          Object.keys(data).forEach(childKey => {
            if (childKey !== '_' && data[childKey]) {
              this.inspectNode(node.get(childKey), `${path || key}.${childKey}`, depth + 1)
            }
          })
        }
      } else {
        console.log(`${indent}📄 ${path || key}:`, data)
      }
    })
  },

  // Inspect specific collections
  inspectPrices(gun) {
    console.log('💰 Inspecting Prices...')
    gun.get('prices').map().once((data, key) => {
      if (data) console.log(`Price ${key}:`, data)
    })
  },

  inspectHistory(gun) {
    console.log('📜 Inspecting History...')
    gun.get('history').map().once((data, key) => {
      if (data) console.log(`History ${key}:`, data)
    })
  },

  // Inspect raw prices data before processing
  inspectRawPrices(gun) {
    console.log('🔍 Inspecting RAW prices data...')
    gun.get('prices').once(data => {
      console.log('Raw prices data:', data)
    })
  },

  // Test Gun connectivity and basic operations
  testConnectivity(gun) {
    console.log('🔗 Testing Gun.js connectivity...')

    // Check if connected to peers
    const peers = Object.keys(gun._.opt.peers || {})
    console.log(`🌐 Connected to ${peers.length} peers:`, peers)

    // Test basic write/read
    const testKey = 'test_' + Date.now()
    const testData = { test: 'value', timestamp: Date.now() }

    console.log('✍️ Writing test data...')
    gun.get(testKey).put(testData)

    setTimeout(() => {
      console.log('📖 Reading test data...')
      gun.get(testKey).once(data => {
        console.log('📋 Test data retrieved:', data)
        if (data && data.test === 'value') {
          console.log('✅ Gun.js is working correctly')
        } else {
          console.log('❌ Gun.js read/write test failed')
        }
        // Clean up test data
        gun.get(testKey).put(null)
      })
    }, 1000)
  },
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.inspectGunDB = inspectGunDB
}