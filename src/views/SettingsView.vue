<template>
  <div class="px-8 py-6 max-w-480 mx-auto">
    <div class="cf-panel mb-8">
      <div class="flex items-center gap-2">
        <input
          id="shareFiltersBetweenMenus"
          type="checkbox"
          v-model="appStore.shareFiltersBetweenMenus"
        />
        <label for="shareFiltersBetweenMenus" class="cf-text-normal">
          {{ $t('divers.settings.shareFiltersBetweenMenus') }}
        </label>
      </div>
    </div>

    <!-- Development Tools Section -->
    <div class="cf-panel mt-8 border border-slate-700">
      <h3 class="text-sm font-bold text-slate-300 mb-4 uppercase">Dev Tools</h3>
      <div class="flex gap-2">
        <button 
          @click="devToolsStore.toggleDebug()"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
        >
          🐛 Debug Info
        </button>
        <button 
          @click="devToolsStore.toggleConsole()"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
        >
          📋 Console (F12)
        </button>
      </div>
      <p class="text-xs text-slate-400 mt-2">Press Ctrl+Shift+I to toggle console</p>
    </div>
  </div>
</template>

<script setup>
import { useDevToolsStore } from '@/stores/useDevToolsStore'
import { useAppStore } from '@/stores/useAppStore'

const appStore = useAppStore()
const devToolsStore = useDevToolsStore()
</script>