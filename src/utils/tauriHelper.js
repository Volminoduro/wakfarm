/**
 * Check if the app is running in Tauri (desktop) or web mode
 * @returns {boolean} true if Tauri is available, false if running in web browser
 */
export function isTauriAvailable() {
  return typeof window !== 'undefined' && 
         window.__TAURI_INTERNALS__ !== undefined
}

/**
 * Safely invoke a Tauri command only if Tauri is available
 * @param {Function} tauriFunction - The Tauri function to call
 * @param {...any} args - Arguments to pass to the function
 * @returns {Promise<any>} - Result from Tauri or null if not available
 */
export async function safeTauriInvoke(tauriFunction, ...args) {
  if (!isTauriAvailable()) {
    return null
  }
  
  try {
    return await tauriFunction(...args)
  } catch (error) {
    console.warn('Tauri invocation failed:', error)
    return null
  }
}
