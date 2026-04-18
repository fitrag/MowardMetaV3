<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">API Keys</h2>
          <p class="text-sm text-gray-400 mt-1">Manage system API keys for AI providers</p>
        </div>
        <button @click="showCreateModal = true" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <PlusIcon class="w-4 h-4 mr-2" />
          Create API Key
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Keys</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ apiKeys.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Active</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ apiKeys.filter(k => k.status === 'active').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Inactive</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ apiKeys.filter(k => k.status === 'inactive').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Providers</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ uniqueProviders.length }}</p>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading API keys...</p>
    </div>

    <div v-else-if="apiKeys.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <KeyIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No API keys found</h3>
      <p class="text-xs text-gray-500">Create your first API key for programmatic access.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Key</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Health</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Errors</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="key in apiKeys" :key="key.id" class="transition-colors hover:bg-gray-50/50">
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <KeyIcon class="w-4 h-4 text-gray-500" />
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ key.name }}</span>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">{{ key.provider }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <code class="bg-gray-50 text-gray-600 px-2 py-1 rounded-md text-xs font-mono">{{ maskKey(key.key) }}</code>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="key.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ key.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="getHealthBadge(key)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ getHealthLabel(key) }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-xs text-gray-500">{{ key.errorCount || key.error_count || 0 }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-xs text-gray-400">{{ formatDate(key.createdAt) }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="(key.errorCount || key.error_count || 0) > 0 || key.isRateLimited || key.is_rate_limited || key.cooldownUntil || key.cooldown_until" @click="handleResetHealth(key.id, key.name)" class="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Reset Health">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                  <button @click="handleRoll(key.id, key.name)" class="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Roll Key">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button @click="handleDelete(key.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Newly Created Key Display -->
    <transition name="slide-up">
      <div v-if="newlyCreatedKey" class="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-emerald-900">API Key Created</h3>
            <p class="text-xs text-emerald-600 mt-0.5">Copy this key now. You will not be able to see it again.</p>
            <div class="flex items-center gap-2 mt-3">
              <code class="flex-1 bg-white px-3 py-2 rounded-lg border border-emerald-200 font-mono text-sm text-emerald-700">{{ newlyCreatedKey }}</code>
              <button @click="copyToClipboard" class="px-3 py-2 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">Copy</button>
            </div>
          </div>
          <button @click="newlyCreatedKey = null" class="text-emerald-400 hover:text-emerald-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- Create Modal -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">Create API Key</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="e.g. Production Key" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Provider</label>
              <select v-model="form.providerId" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="">Select provider</option>
                <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">API Key Value</label>
              <input v-model="form.apiKey" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-mono" placeholder="sk-..." minlength="8" />
              <p class="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50" :disabled="submitting">{{ submitting ? 'Creating...' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Roll Confirmation Modal -->
    <transition name="slide-up">
      <div v-if="showRollModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="showRollModal = false">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">Roll API Key</h3>
              <p class="text-sm text-gray-500">{{ rollingKeyName }}</p>
            </div>
          </div>
          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5">
            <p class="text-sm text-amber-800">This will generate a new API key and replace the old one. The old key will no longer work.</p>
          </div>
          <div class="flex gap-3">
            <button @click="showRollModal = false" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button @click="confirmRoll" class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50" :disabled="rolling">{{ rolling ? 'Rolling...' : 'Roll Key' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Rolled Key Display -->
    <transition name="slide-up">
      <div v-if="rolledKey" class="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-emerald-900">API Key Rolled Successfully</h3>
            <p class="text-xs text-emerald-600 mt-0.5">Copy this new key now. You will not be able to see it again.</p>
            <div class="flex items-center gap-2 mt-3">
              <code class="flex-1 bg-white px-3 py-2 rounded-lg border border-emerald-200 font-mono text-sm text-emerald-700">{{ rolledKey }}</code>
              <button @click="copyRolledKey" class="px-3 py-2 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">Copy</button>
            </div>
          </div>
          <button @click="rolledKey = null" class="text-emerald-400 hover:text-emerald-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, KeyIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const apiKeys = ref([])
const providers = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const showRollModal = ref(false)
const submitting = ref(false)
const rolling = ref(false)
const newlyCreatedKey = ref(null)
const rolledKey = ref(null)
const rollingKeyId = ref(null)
const rollingKeyName = ref('')
const form = ref({ name: '', providerId: '', apiKey: '' })

const uniqueProviders = computed(() => {
  return [...new Set(apiKeys.value.map(k => k.provider))]
})

onMounted(async () => {
  try {
    const [keysData, providersData] = await Promise.all([
      adminService.getApiKeys(),
      adminService.getProviders()
    ])
    apiKeys.value = keysData
    providers.value = providersData
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
})

const maskKey = (key) => {
  if (!key) return ''
  if (key.length <= 12) return '****'
  return key.substring(0, 6) + '...' + key.substring(key.length - 4)
}

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (!form.value.apiKey || form.value.apiKey.trim().length < 8) {
      alert('API key must be at least 8 characters long')
      submitting.value = false
      return
    }
    const providerId = typeof form.value.providerId === 'string' ? parseInt(form.value.providerId) : form.value.providerId
    const response = await adminService.createApiKey({ providerId, name: form.value.name, apiKey: form.value.apiKey })
    newlyCreatedKey.value = response.key || response.fullKey || response.apiKey || 'Key created successfully'
    closeModal()
    apiKeys.value = await adminService.getApiKeys()
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to create API key'
    alert(errorMsg)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this API key?')) return
  try {
    await adminService.deleteApiKey(id)
    apiKeys.value = apiKeys.value.filter(k => k.id !== id)
  } catch (error) {
    alert('Failed to delete API key')
  }
}

const handleRoll = (id, name) => {
  rollingKeyId.value = id
  rollingKeyName.value = name
  showRollModal.value = true
}

const confirmRoll = async () => {
  rolling.value = true
  try {
    const result = await adminService.rollApiKey(rollingKeyId.value)
    rolledKey.value = result.newApiKey
    apiKeys.value = await adminService.getApiKeys()
    showRollModal.value = false
  } catch (error) {
    alert('Failed to roll API key')
  } finally {
    rolling.value = false
  }
}

const copyRolledKey = async () => {
  try {
    await navigator.clipboard.writeText(rolledKey.value)
    alert('Key copied to clipboard')
  } catch {
    alert('Failed to copy')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  form.value = { name: '', providerId: '', apiKey: '' }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(newlyCreatedKey.value)
    alert('Key copied to clipboard')
  } catch {
    alert('Failed to copy')
  }
}

const getHealthLabel = (key) => {
  const now = new Date()
  if (key.isRateLimited || key.is_rate_limited) {
    const cooldown = key.cooldownUntil || key.cooldown_until
    if (cooldown && new Date(cooldown) > now) {
      const mins = Math.ceil((new Date(cooldown) - now) / 60000)
      return `Cooldown (${mins}m)`
    }
    return 'Rate Limited'
  }
  const errors = key.errorCount || key.error_count || 0
  if (errors > 0) return `Degraded (${errors})`
  return 'Healthy'
}

const getHealthBadge = (key) => {
  const now = new Date()
  if (key.isRateLimited || key.is_rate_limited) {
    const cooldown = key.cooldownUntil || key.cooldown_until
    if (cooldown && new Date(cooldown) > now) return 'bg-amber-50 text-amber-700'
    return 'bg-rose-50 text-rose-700'
  }
  const errors = key.errorCount || key.error_count || 0
  if (errors > 0) return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

const handleResetHealth = async (id, name) => {
  if (!confirm(`Reset health for "${name}"? This will clear error count and rate limit status.`)) return
  try {
    await adminService.resetApiKeyHealth(id)
    apiKeys.value = await adminService.getApiKeys()
  } catch (error) {
    alert('Failed to reset key health')
  }
}
</script>
