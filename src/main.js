import { createApp } from 'vue'
import '@/style.css'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useConfigRunStore } from '@/stores/useConfigRunStore'
import { useP2PStore } from '@/stores/useP2PStore'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { createI18nInstance } from '@/i18n'

const pinia = createPinia()

async function bootstrap() {
	const i18n = await createI18nInstance(localStorage.getItem('lang') || 'fr')
	const app = createApp(App)
	app.use(pinia)
	app.use(i18n)
	app.mount('#app')
	// Initialize stores (pass pinia instance to avoid active-Pinia timing issues)
	useAppStore(pinia)
	useJsonStore(pinia)
	useConfigRunStore(pinia)
	useP2PStore(pinia).init()
	usePersonalPricesStore(pinia).init()
}

bootstrap()