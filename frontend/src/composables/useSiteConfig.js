import { ref } from 'vue'
import { publicService } from '../services/publicService'

const siteName = ref('ShowModel')
const siteDescription = ref('')
const loaded = ref(false)

export function useSiteConfig() {
  const loadSettings = async () => {
    if (loaded.value) return
    try {
      const settings = await publicService.getPublicSettings()
      const appNameSetting = settings.find(s => s.settingKey === 'general.app_name')
      const appDescSetting = settings.find(s => s.settingKey === 'general.app_description')
      if (appNameSetting) siteName.value = appNameSetting.value
      if (appDescSetting) siteDescription.value = appDescSetting.value
      loaded.value = true
    } catch (error) {
      console.error('Failed to load site settings:', error)
    }
  }

  const refresh = async () => {
    loaded.value = false
    await loadSettings()
  }

  return { siteName, siteDescription, loadSettings, refresh }
}
