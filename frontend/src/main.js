import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useSiteConfig } from './composables/useSiteConfig'

const app = createApp(App)

app.use(router)

const { loadSettings } = useSiteConfig()
loadSettings()

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
}

app.mount('#app')
