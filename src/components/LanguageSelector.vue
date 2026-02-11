<template>
  <div class="flex gap-2.5">
    <button
      v-for="lang in languages"
      :key="lang.code"
      @click="handleChange(lang.code)"
      :class="[
        'px-3 py-1 transition-all border-b-2 text-slate-100',
        currentLanguage === lang.code 
          ? '' 
          : 'border-transparent opacity-70 hover:opacity-100'
      ]"
      :style="currentLanguage === lang.code ? 'border-color: var(--color-wakfu-text)' : ''"
      @mouseenter="(e) => currentLanguage !== lang.code && (e.target.style.borderColor = 'var(--color-wakfu-text-alt)')"
      @mouseleave="(e) => currentLanguage !== lang.code && (e.target.style.borderColor = 'transparent')"
      :title="lang.name"
    >
      {{ lang.flag }}
    </button>
  </div>
</template>


<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setI18nLocale } from '@/i18n'

const i18n = useI18n({ useScope: 'global' })
const { locale } = i18n

const currentLanguage = computed(() => locale.value)

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
]

const handleChange = async (langCode) => {
  const changed = await setI18nLocale(i18n, langCode)
  if (changed) {
    localStorage.setItem('lang', langCode)
  }
}

</script>