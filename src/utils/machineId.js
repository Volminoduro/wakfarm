/**
 * Machine ID generation for both Tauri (desktop) and Web environments
 * 
 * - Tauri: Uses hardware-based machine ID from Rust backend
 * - Web: Uses IP address + browser fingerprint hashed for consistency
 */

import { invoke } from '@tauri-apps/api/core'

let lastMachineIdSource = 'unknown'

/**
 * Detects if the app is running in Tauri environment
 */
function isTauri() {
  return '__TAURI__' in window
}

/**
 * Hash a string using SHA-256 (Web Crypto API)
 * @param {string} message - The message to hash
 * @returns {Promise<string>} - Hex string of the hash
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Get IP address from external API (for web environment)
 * @returns {Promise<string|null>} - IP address or null if failed
 */
async function getIPAddress() {
  try {
    // Try multiple IP detection services as fallback
    const services = [
      'https://api.ipify.org?format=json',
      'https://api.my-ip.io/v2/ip.json',
      'https://ifconfig.me/ip'
    ]

    for (const service of services) {
      try {
        const response = await fetch(service, { 
          method: 'GET',
          cache: 'no-cache'
        })
        
        if (!response.ok) continue

        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          // Handle different JSON response formats
          const ip = data.ip || data.IP || data.query || null
          if (ip) return ip
        } else {
          // Plain text response
          const ip = await response.text()
          if (ip && ip.trim()) return ip.trim()
        }
      } catch (err) {
        console.warn(`Failed to fetch IP from ${service}:`, err)
        continue
      }
    }

    console.warn('All IP services failed')
    return null
  } catch (error) {
    console.error('Error getting IP address:', error)
    return null
  }
}

/**
 * Get browser fingerprint (simple version)
 * @returns {string} - Browser fingerprint
 */
function getBrowserFingerprint() {
  // Combine various browser properties for a simple fingerprint
  const ua = navigator.userAgent || ''
  const lang = navigator.language || ''
  const platform = navigator.platform || ''
  const screenRes = `${screen.width}x${screen.height}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  
  return `${ua}|${lang}|${platform}|${screenRes}|${timezone}`
}

/**
 * Get machine ID for web environment (IP-based with browser fingerprint)
 * @returns {Promise<string|null>} - Machine ID or null if failed
 */
async function getWebMachineId() {
  try {
    // Try to get from cache first (localStorage)
    const cached = localStorage.getItem('wakfarm_machine_id_cache')
    const cacheTimestamp = localStorage.getItem('wakfarm_machine_id_timestamp')
    const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
    
    if (cached && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp, 10)
      if (age < CACHE_DURATION) {
        const cachedSource = localStorage.getItem('wakfarm_machine_id_source')
        lastMachineIdSource = cachedSource || 'web_cached_unknown'
        console.info('Using cached machine ID (web)')
        return cached
      }
    }

    // Get IP address
    const ip = await getIPAddress()
    
    if (!ip) {
      console.warn('Could not get IP address, using browser fingerprint only')
      // Fallback to browser fingerprint only if IP fails
      const fingerprint = getBrowserFingerprint()
      const machineId = await sha256(`fingerprint_${fingerprint}`)
      lastMachineIdSource = 'web_fingerprint_only'
      
      // Cache the result
      localStorage.setItem('wakfarm_machine_id_cache', machineId)
      localStorage.setItem('wakfarm_machine_id_timestamp', Date.now().toString())
      localStorage.setItem('wakfarm_machine_id_source', lastMachineIdSource)
      
      return machineId
    }

    // Combine IP + browser fingerprint for better stability
    const fingerprint = getBrowserFingerprint()
    const combined = `${ip}|${fingerprint}`
    const machineId = await sha256(combined)
    lastMachineIdSource = 'web_ip_fingerprint'
    
    // Cache the result
    localStorage.setItem('wakfarm_machine_id_cache', machineId)
    localStorage.setItem('wakfarm_machine_id_timestamp', Date.now().toString())
    localStorage.setItem('wakfarm_machine_id_source', lastMachineIdSource)
    
    console.info('Generated web machine ID from IP + fingerprint')
    return machineId
  } catch (error) {
    console.error('Error generating web machine ID:', error)
    return null
  }
}

/**
 * Get machine ID for Tauri environment (hardware-based)
 * @returns {Promise<string|null>} - Machine ID or null if failed
 */
async function getTauriMachineId() {
  try {
    const machineId = await invoke('get_machine_id')
    lastMachineIdSource = 'desktop_hardware'
    console.info('Got machine ID from Tauri backend')
    return machineId
  } catch (error) {
    console.error('Error getting Tauri machine ID:', error)
    return null
  }
}

/**
 * Get machine ID (works in both Tauri and Web environments)
 * @returns {Promise<string|null>} - Machine ID or null if failed
 */
export async function getMachineId() {
  if (isTauri()) {
    return await getTauriMachineId()
  } else {
    return await getWebMachineId()
  }
}

/**
 * Check if running in Tauri environment
 * @returns {boolean}
 */
export function isRunningInTauri() {
  return isTauri()
}

export function getMachineIdSource() {
  if (isTauri()) return 'desktop_hardware'
  return lastMachineIdSource || 'web_cached_unknown'
}
