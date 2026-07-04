<template>
  <footer class="cf-footer ">
    <div class="flex justify-between items-center">
      <p>{{ $t('divers.footer_title') }}<span v-if="version" class="ml-2 opacity-50">v{{ version }}</span></p>
      <p>{{ $t('divers.footer_steles_update') }} xx.xx.xxxx</p>
      <p class="flex items-center gap-2">
        <span>{{ $t('divers.footer_disclaimer') }}</span>
        <span class="text-xs opacity-70">• {{ $t('divers.footer_contact') }}: <span class="font-mono">.vesperal</span></span>
      </p>
    </div>
  </footer>
</template>

<script setup>
// Version injectee au build depuis package.json (cf. vite.config.js)
const version = import.meta.env.VITE_APP_VERSION || ''
</script>
