<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">AI Providers</h2>
          <p class="text-sm text-gray-400 mt-1">Manage AI model providers and their configurations</p>
        </div>
        <button @click="openCreateModal" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Provider
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Providers</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ providers.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Active</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ providers.filter(p => p.status === 'active').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Models</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ totalModels }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Drivers</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ uniqueDrivers.length }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-xl border border-gray-100 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search providers..." class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
        </div>
        <select v-model="statusFilter" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <!-- Provider Cards -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading providers...</p>
    </div>

    <div v-else-if="filteredProviders.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <CpuChipIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No providers found</h3>
      <p class="text-xs text-gray-500">Get started by creating your first AI provider.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="provider in filteredProviders"
        :key="provider.id"
        class="bg-white rounded-xl border transition-all duration-200 hover:shadow-md"
        :class="provider.status === 'active' ? 'border-gray-100' : 'border-gray-100 opacity-75'"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getDriverBg(provider.driver)">
                <CpuChipIcon class="w-5 h-5" :class="getDriverColor(provider.driver)" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ provider.name }}</h3>
                <code class="text-xs text-gray-400 font-mono">{{ provider.slug }}</code>
              </div>
            </div>
            <span :class="getStatusBadge(provider.status)">{{ provider.status }}</span>
          </div>

          <!-- Driver Info -->
          <div class="flex items-center gap-2 mb-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
              {{ getDriverLabel(provider.driver) }}
            </span>
            <span v-if="provider.baseUrl" class="text-xs text-gray-400 truncate max-w-[150px]" :title="provider.baseUrl">
              {{ provider.baseUrl }}
            </span>
          </div>

          <!-- Model Count -->
          <div class="flex items-center justify-between py-3 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span class="text-xs text-gray-500">{{ provider.modelCount || 0 }} model(s)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-4">
            <router-link :to="`/admin/providers/${provider.id}`" class="flex-1 py-2 px-3 text-xs font-medium text-center rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">
              Manage Models
            </router-link>
            <button @click="handleFetchModels(provider)" class="py-2 px-3 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" title="Fetch Models">
              <ArrowPathIcon class="w-4 h-4" />
            </button>
            <button @click="handleEdit(provider)" class="py-2 px-3 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="handleDelete(provider.id)" class="py-2 px-3 text-xs font-medium rounded-lg bg-gray-100 text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingProvider ? 'Edit Provider' : 'Create Provider' }}</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="e.g. OpenAI" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
              <input v-model="form.slug" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 lowercase" placeholder="e.g. openai" :readonly="!!editingProvider" />
              <p class="text-xs text-gray-400 mt-1">Lowercase, hyphens allowed. Cannot be changed after creation.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Driver</label>
              <select v-model="form.driver" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="openai">OpenAI Compatible</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="kie">Kie.ai (Gemini)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Base URL <span class="text-gray-400">(Optional)</span></label>
              <input v-model="form.baseUrl" type="url" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="e.g. https://api.openai.com/v1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select v-model="form.status" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50" :disabled="submitting">{{ submitting ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Fetch Models Modal -->
    <transition name="slide-up">
      <div v-if="showFetchModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeFetchModal">
        <div class="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" @click.stop>
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-base font-semibold text-gray-900">Models for {{ fetchingProvider?.name }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ fetchingProvider?.driver }} · {{ fetchingProvider?.baseUrl || 'Default URL' }}</p>
            </div>
            <button @click="closeFetchModal" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div v-if="fetching" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
            <p class="mt-3 text-sm text-gray-400">Fetching models...</p>
          </div>

          <div v-else-if="fetchedModels.length === 0" class="text-center py-8">
            <CpuChipIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h4 class="text-sm font-medium text-gray-900 mb-1">No models found</h4>
            <p class="text-xs text-gray-500">Make sure the provider has an active API key configured.</p>
          </div>

          <div v-else>
            <p class="text-xs text-gray-400 mb-3">{{ fetchedModels.length }} model(s) found</p>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="(model, index) in fetchedModels"
                :key="index"
                class="p-3 border border-gray-100 rounded-lg"
              >
                <p class="text-sm font-mono font-medium text-gray-900">{{ model.name || model.model || model.id || model.modelCode }}</p>
                <p v-if="model.description" class="text-xs text-gray-400 mt-1">{{ model.description }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-5">
            <button @click="closeFetchModal" class="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">Close</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, CpuChipIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const providers = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const showFetchModal = ref(false)
const editingProvider = ref(null)
const fetchingProvider = ref(null)
const submitting = ref(false)
const fetching = ref(false)
const fetchedModels = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const form = ref({ name: '', slug: '', driver: 'openai', baseUrl: '', status: 'active' })

const filteredProviders = computed(() => {
  let result = providers.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.driver.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter(p => p.status === statusFilter.value)
  }
  return result
})

const totalModels = computed(() => {
  return providers.value.reduce((sum, p) => sum + (p.modelCount || 0), 0)
})

const uniqueDrivers = computed(() => {
  return [...new Set(providers.value.map(p => p.driver))]
})

onMounted(async () => {
  try {
    providers.value = await adminService.getProviders()
  } catch (error) {
    console.error('Failed to load providers:', error)
  } finally {
    loading.value = false
  }
})

const getDriverLabel = (driver) => {
  const labels = { openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Gemini', kie: 'Kie.ai', openrouter: 'OpenRouter', ollama: 'Ollama', custom: 'Custom' }
  return labels[driver] || driver
}

const getDriverBg = (driver) => {
  const bgs = { openai: 'bg-violet-100', anthropic: 'bg-amber-100', gemini: 'bg-emerald-100', kie: 'bg-sky-100', openrouter: 'bg-blue-100', ollama: 'bg-rose-100', custom: 'bg-gray-100' }
  return bgs[driver] || 'bg-gray-100'
}

const getDriverColor = (driver) => {
  const colors = { openai: 'text-violet-700', anthropic: 'text-amber-700', gemini: 'text-emerald-700', kie: 'text-sky-700', openrouter: 'text-blue-700', ollama: 'text-rose-700', custom: 'text-gray-700' }
  return colors[driver] || 'text-gray-700'
}

const getStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const map = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-gray-100 text-gray-500' }
  return `${base} ${map[status] || 'bg-gray-50 text-gray-600'}`
}

const openCreateModal = () => {
  editingProvider.value = null
  form.value = { name: '', slug: '', driver: 'openai', baseUrl: '', status: 'active' }
  showCreateModal.value = true
}

const handleEdit = (provider) => {
  editingProvider.value = provider
  form.value = { name: provider.name, slug: provider.slug, driver: provider.driver, baseUrl: provider.baseUrl || '', status: provider.status }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingProvider.value) {
      const changes = {}
      if (form.value.name !== editingProvider.value.name) changes.name = form.value.name
      if (form.value.slug !== editingProvider.value.slug) changes.slug = form.value.slug
      if (form.value.driver !== editingProvider.value.driver) changes.driver = form.value.driver
      if (form.value.baseUrl !== (editingProvider.value.baseUrl || '')) changes.baseUrl = form.value.baseUrl
      if (form.value.status !== editingProvider.value.status) changes.status = form.value.status
      await adminService.updateProvider(editingProvider.value.id, changes)
    } else {
      await adminService.createProvider(form.value)
    }
    closeModal()
    providers.value = await adminService.getProviders()
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to save provider')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this provider?')) return
  try {
    await adminService.deleteProvider(id)
    providers.value = providers.value.filter(p => p.id !== id)
  } catch (error) {
    alert('Failed to delete provider')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingProvider.value = null
  form.value = { name: '', slug: '', driver: 'openai', baseUrl: '', status: 'active' }
}

const handleFetchModels = async (provider) => {
  fetchingProvider.value = provider
  fetching.value = true
  showFetchModal.value = true
  fetchedModels.value = []
  try {
    const models = await adminService.fetchProviderModels(provider.id)
    fetchedModels.value = models || []
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch models'
    alert(errorMsg)
    showFetchModal.value = false
  } finally {
    fetching.value = false
  }
}

const closeFetchModal = () => {
  showFetchModal.value = false
  fetchingProvider.value = null
  fetchedModels.value = []
}
</script>
