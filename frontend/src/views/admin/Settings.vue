<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Settings</h2>
          <p class="text-sm text-gray-400 mt-1">Configure application settings</p>
        </div>
        <button @click="handleSaveAll" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50" :class="hasChanges ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-white/10 text-gray-400 cursor-not-allowed'" :disabled="submitting || !hasChanges">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ submitting ? 'Saving...' : 'Save All Changes' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading settings...</p>
    </div>

    <!-- Settings Groups -->
    <div v-else class="space-y-6">
      <div v-for="group in settingGroups" :key="group.label" class="bg-white rounded-xl border border-gray-100 p-6">
        <h3 class="text-sm font-medium text-gray-900 mb-4">{{ group.label }}</h3>
        <div class="space-y-5">
          <div v-for="setting in group.items" :key="setting.settingKey || setting.id" class="flex items-start gap-6">
            <div class="flex-1 min-w-0">
              <label class="block text-sm font-medium text-gray-700">{{ formatLabel(setting.settingKey || setting.key) }}</label>
              <p v-if="setting.description" class="text-xs text-gray-400 mt-0.5">{{ setting.description }}</p>
            </div>
            <div class="w-64 flex-shrink-0">
              <input
                v-if="setting.valueType === 'number'"
                v-model.number="setting.editValue"
                type="number"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                :class="{ 'border-amber-300 bg-amber-50': setting.editValue !== setting.originalValue }"
                @input="markChanged(setting)"
              />
              <textarea
                v-else-if="setting.valueType === 'text'"
                v-model="setting.editValue"
                rows="2"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                :class="{ 'border-amber-300 bg-amber-50': setting.editValue !== setting.originalValue }"
                @input="markChanged(setting)"
              ></textarea>
              <select
                v-else-if="setting.valueType === 'boolean'"
                v-model="setting.editValue"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white"
                :class="{ 'border-amber-300 bg-amber-50': setting.editValue !== setting.originalValue }"
                @change="markChanged(setting)"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
              <input
                v-else
                v-model="setting.editValue"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                :class="{ 'border-amber-300 bg-amber-50': setting.editValue !== setting.originalValue }"
                @input="markChanged(setting)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unsaved Changes Indicator -->
    <div v-if="hasChanges && !loading" class="fixed bottom-6 right-6 z-40">
      <div class="bg-gray-900 rounded-xl px-5 py-3 text-white shadow-lg flex items-center gap-3">
        <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
        <span class="text-sm">Unsaved changes</span>
        <button @click="handleSaveAll" class="ml-2 px-3 py-1 text-xs font-medium bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" :disabled="submitting">
          {{ submitting ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminService } from '../../services/adminService'

const settings = ref([])
const loading = ref(true)
const submitting = ref(false)

const hasChanges = computed(() => {
  return settings.value.some(s => s.editValue !== s.originalValue)
})

const settingGroups = computed(() => {
  const groups = {}
  for (const s of settings.value) {
    const rawKey = s.settingKey || s.key || 'other'
    const groupKey = s.groupKey || rawKey.split('_')[0]
    const label = {
      payments: 'Payments',
      generation: 'Generation',
      registration: 'Registration',
      general: 'General',
      app: 'Application',
    }[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
    if (!groups[label]) groups[label] = { label, items: [] }
    groups[label].items.push(s)
  }
  return Object.values(groups)
})

onMounted(async () => {
  try {
    const data = await adminService.getSettings()
    settings.value = data.map(s => ({
      ...s,
      editValue: s.value,
      originalValue: s.value
    }))
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
})

const formatLabel = (key) => {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const markChanged = () => {
  settings.value = [...settings.value]
}

const handleSaveAll = async () => {
  if (!confirm('Save all changes?')) return
  submitting.value = true
  try {
    const changed = settings.value.filter(s => s.editValue !== s.originalValue)
    await Promise.all(changed.map(s => adminService.updateSetting(s.settingKey || s.key, s.editValue)))
    const data = await adminService.getSettings()
    settings.value = data.map(s => ({ ...s, editValue: s.value, originalValue: s.value }))
    alert('Settings saved successfully')
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('Failed to save settings')
  } finally {
    submitting.value = false
  }
}
</script>
