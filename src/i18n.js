
import { createI18n } from 'vue-i18n'

const localeLoaders = import.meta.glob('./names/*.json')
const messagesCache = {}

// Fonction utilitaire pour charger dynamiquement un fichier JSON de traduction
async function loadLocaleMessages(locale) {
  if (messagesCache[locale]) return messagesCache[locale]

  const loader = localeLoaders[`./names/${locale}.json`]
  if (!loader) return null

  const mod = await loader()
  const messages = mod.default || mod
  messagesCache[locale] = messages
  return messages
}

export async function createI18nInstance(locale = 'fr') {
  const requestedMessages = await loadLocaleMessages(locale)
  const fallbackMessages = locale === 'fr' ? requestedMessages : await loadLocaleMessages('fr')

  const messages = {
    fr: fallbackMessages || {},
    [locale]: requestedMessages || fallbackMessages || {}
  }

  return createI18n({
    legacy: false,
    locale: requestedMessages ? locale : 'fr',
    fallbackLocale: 'fr',
    messages
  })
}

export async function setI18nLocale(i18n, locale) {
  const requestedMessages = await loadLocaleMessages(locale)
  if (!requestedMessages) return false

  i18n.setLocaleMessage(locale, requestedMessages)
  i18n.locale.value = locale
  return true
}
