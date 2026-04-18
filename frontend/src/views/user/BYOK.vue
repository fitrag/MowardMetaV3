<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Bring Your Own Keys</h2>
          <p class="text-sm text-gray-400 mt-1">Use your own API keys to access AI providers directly</p>
        </div>
        <button @click="showCreateModal = true" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-150">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add API Key
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-2 text-sm text-gray-400">Loading API keys...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="byokKeys.length === 0" class="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20">
      <KeyIcon class="w-12 h-12 text-gray-200 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No API keys added</h3>
      <p class="text-xs text-gray-400 mb-4">Add your own API keys to use with AI providers</p>
      <button @click="showCreateModal = true" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150">
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Your First API Key
      </button>
    </div>

    <!-- Keys Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="key in byokKeys"
        :key="key.id"
        class="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors duration-150"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <KeyIcon class="w-5 h-5 text-violet-700" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900">{{ key.name }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ key.provider?.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button @click="handleFetchModels(key)" class="p-1.5 text-gray-300 hover:text-gray-900 transition-colors duration-150 rounded-lg hover:bg-gray-50" title="Fetch Models">
              <ArrowPathIcon class="w-4 h-4" />
            </button>
            <button @click="handleRoll(key.id, key.name)" class="p-1.5 text-gray-300 hover:text-amber-600 transition-colors duration-150 rounded-lg hover:bg-amber-50" title="Roll Key">
              <ArrowPathRoundedSquareIcon class="w-4 h-4" />
            </button>
            <button @click="handleEdit(key)" class="p-1.5 text-gray-300 hover:text-violet-600 transition-colors duration-150 rounded-lg hover:bg-gray-50" title="Edit">
              <PencilIcon class="w-4 h-4" />
            </button>
            <button @click="handleDelete(key.id)" class="p-1.5 text-gray-300 hover:text-rose-600 transition-colors duration-150 rounded-lg hover:bg-gray-50" title="Delete">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Masked Key -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-400 mb-1">API Key</p>
          <p class="text-sm font-mono text-gray-700">{{ maskKey(key.apiKey) }}</p>
        </div>

        <!-- Info -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-50">
          <div class="flex items-center gap-4">
            <span :class="getStatusBadge(key.status)">{{ key.status }}</span>
            <span :class="getHealthBadge(key)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">{{ getHealthLabel(key) }}</span>
            <span class="text-xs text-gray-400">Added {{ formatDate(key.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <div class="bg-white rounded-xl border border-gray-100 p-6">
      <h3 class="text-sm font-medium text-gray-900 mb-4">How BYOK works</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-violet-700">1</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Add Your Key</p>
            <p class="text-xs text-gray-400 mt-0.5">Enter your API key and select the provider</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-amber-700">2</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Generate Metadata</p>
            <p class="text-xs text-gray-400 mt-0.5">Select your key when generating to use it directly</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-emerald-700">3</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">No Credit Cost</p>
            <p class="text-xs text-gray-400 mt-0.5">Using your own key doesn't consume platform credits</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      @click="closeModal"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold text-gray-900">
            {{ editingKey ? 'Edit API Key' : 'Add API Key' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
            <input v-model="form.name" type="text" required class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors duration-150" placeholder="My API Key" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">Provider</label>
            <select v-model="form.providerId" required class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors duration-150">
              <option value="">Select provider</option>
              <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                {{ provider.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">API Key</label>
            <input v-model="form.apiKey" type="text" required class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors duration-150 font-mono" placeholder="sk-..." minlength="8" />
            <p class="mt-1.5 text-xs text-gray-400">Minimum 8 characters</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150">Cancel</button>
            <button type="submit" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Fetch Models Modal -->
    <div v-if="showFetchModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeFetchModal">
      <div class="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" @click.stop>
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Models for {{ fetchingKey?.name }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ fetchingKey?.provider?.name }}</p>
          </div>
          <button @click="closeFetchModal" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <div v-if="fetching" class="flex flex-col items-center justify-center py-12">
          <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-3 text-sm text-gray-400">Fetching models...</p>
          <p class="text-xs text-gray-300 mt-1">This may take a few seconds</p>
        </div>

        <div v-else-if="fetchedModels.length === 0" class="flex flex-col items-center justify-center py-12">
          <KeyIcon class="w-10 h-10 text-gray-200 mb-3" />
          <h4 class="text-sm font-medium text-gray-900 mb-1">No models found</h4>
          <p class="text-xs text-gray-400 text-center">Could not fetch models. Please check your API key is valid.</p>
        </div>

        <div v-else>
          <p class="text-xs text-gray-400 mb-3">{{ fetchedModels.length }} model(s) found</p>
          <div class="space-y-2">
            <div
              v-for="(model, index) in fetchedModels"
              :key="index"
              class="p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors duration-150"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ model.name || model.model || model.id || model.modelCode }}</p>
                  <p v-if="model.description" class="text-xs text-gray-400 mt-0.5">{{ model.description }}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{{ model.type || model.driver || 'model' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <button @click="closeFetchModal" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150">Close</button>
        </div>
      </div>
    </div>

    <!-- Roll Confirmation Modal -->
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
            <p class="text-sm text-gray-500">{{ rollingKey?.name }}</p>
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
import { ref, onMounted } from 'vue'
import { PlusIcon, KeyIcon, PencilIcon, TrashIcon, ArrowPathIcon, ArrowPathRoundedSquareIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'
import { publicService } from '../../services/publicService'

const byokKeys = ref([])
const providers = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const showFetchModal = ref(false)
const showRollModal = ref(false)
const editingKey = ref(null)
const fetchingKey = ref(null)
const rollingKey = ref(null)
const submitting = ref(false)
const fetching = ref(false)
const rolling = ref(false)
const fetchedModels = ref([])
const rolledKey = ref(null)
const form = ref({
  name: '',
  providerId: '',
  apiKey: ''
})

onMounted(async () => {
  try {
    const [keys, providersData] = await Promise.all([
      userService.getBYOKKeys(),
      publicService.getPublicProviders()
    ])
    byokKeys.value = keys
    providers.value = providersData
  } catch (error) {
    console.error('Failed to load BYOK keys or providers:', error)
  } finally {
    loading.value = false
  }
})

const handleEdit = (key) => {
  editingKey.value = key
  form.value = {
    name: key.name,
    providerId: key.providerId,
    apiKey: ''
  }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (!form.value.apiKey || form.value.apiKey.trim().length < 8) {
      alert('API key must be at least 8 characters long')
      submitting.value = false
      return
    }

    const providerId = typeof form.value.providerId === 'string' 
      ? parseInt(form.value.providerId) 
      : form.value.providerId

    if (editingKey.value) {
      await userService.updateBYOKKey(editingKey.value.id, {
        ...form.value,
        providerId
      })
    } else {
      await userService.createBYOKKey(providerId, form.value.name, form.value.apiKey)
    }
    
    closeModal()
    byokKeys.value = await userService.getBYOKKeys()
  } catch (error) {
    console.error('Failed to save API key:', error)
    const errorMsg = error.response?.data?.error || error.message || 'Failed to save API key'
    alert(errorMsg)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this API key?')) return

  try {
    await userService.deleteBYOKKey(id)
    byokKeys.value = byokKeys.value.filter(k => k.id !== id)
  } catch (error) {
    console.error('Failed to delete API key:', error)
    alert('Failed to delete API key')
  }
}

const handleRoll = (id, name) => {
  rollingKey.value = { id, name }
  showRollModal.value = true
}

const confirmRoll = async () => {
  rolling.value = true
  try {
    const result = await userService.rollBYOKKey(rollingKey.value.id)
    rolledKey.value = result.newApiKey
    byokKeys.value = await userService.getBYOKKeys()
    showRollModal.value = false
  } catch (error) {
    console.error('Failed to roll API key:', error)
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
  editingKey.value = null
  form.value = { name: '', providerId: '', apiKey: '' }
}

const handleFetchModels = async (key) => {
  fetchingKey.value = key
  fetching.value = true
  showFetchModal.value = true
  fetchedModels.value = []

  try {
    const models = await userService.fetchModelsFromBYOK(key.id)
    fetchedModels.value = models || []
  } catch (error) {
    console.error('Failed to fetch models:', error)
    const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch models'
    alert(errorMsg)
    showFetchModal.value = false
  } finally {
    fetching.value = false
  }
}

const closeFetchModal = () => {
  showFetchModal.value = false
  fetchingKey.value = null
  fetchedModels.value = []
}

const maskKey = (key) => {
  if (!key) return '••••••••'
  if (key.length <= 12) return '••••••••'
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusMap = {
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    expired: 'bg-gray-400 text-white'
  }
  return `${base} ${statusMap[status] || 'bg-gray-50 text-gray-600'}`
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
</script>
