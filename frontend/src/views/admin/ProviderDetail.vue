<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="!provider && loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading provider...</p>
    </div>

    <template v-if="provider">
      <!-- Header -->
      <div class="bg-gray-950 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link to="/admin/providers" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </router-link>
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="getDriverBg(provider.driver)">
              <CpuChipIcon class="w-6 h-6" :class="getDriverColor(provider.driver)" />
            </div>
            <div>
              <h2 class="text-lg font-medium">{{ provider.name }}</h2>
              <div class="flex items-center gap-3 mt-1">
                <code class="text-xs text-gray-400 font-mono">{{ provider.slug }}</code>
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/10 text-gray-300 capitalize">{{ provider.driver }}</span>
                <span :class="provider.status === 'active' ? 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300' : 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-500/20 text-gray-400'">{{ provider.status }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="handleFetchModels" class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors" :disabled="fetching">
              <ArrowPathIcon v-if="!fetching" class="w-4 h-4 mr-2" />
              <div v-else class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
              {{ fetching ? 'Fetching...' : 'Fetch from API' }}
            </button>
            <button @click="openCreateModal" class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
              <PlusIcon class="w-4 h-4 mr-2" />
              Add Model
            </button>
          </div>
        </div>
        <div v-if="provider.baseUrl" class="mt-4 pt-4 border-t border-white/10">
          <p class="text-xs text-gray-400">Base URL</p>
          <p class="text-sm font-mono text-gray-300 mt-0.5">{{ provider.baseUrl }}</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <p class="text-xs text-gray-400">Total Models</p>
          <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ models.length }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <p class="text-xs text-emerald-600">Active</p>
          <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ models.filter(m => m.status === 'active').length }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <p class="text-xs text-gray-400">Default Model</p>
          <p class="text-sm font-medium text-gray-900 mt-0.5 truncate">{{ defaultModel?.name || 'Not set' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <p class="text-xs text-gray-400">Inactive</p>
          <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ models.filter(m => m.status === 'inactive').length }}</p>
        </div>
      </div>

      <!-- Search -->
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" type="text" placeholder="Search models..." class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
          </div>
          <select v-model="statusFilter" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Models Table -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        <p class="mt-3 text-sm text-gray-400">Loading models...</p>
      </div>

      <div v-else-if="filteredModels.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
        <CpuChipIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 class="text-sm font-medium text-gray-900 mb-1">No models found</h3>
        <p class="text-xs text-gray-500 mb-4">Add models manually or fetch from provider's API</p>
        <div class="flex justify-center gap-3">
          <button @click="handleFetchModels" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" :disabled="fetching">
            <ArrowPathIcon v-if="!fetching" class="w-4 h-4 mr-2" />
            <div v-else class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-gray-600 mr-2"></div>
            {{ fetching ? 'Fetching...' : 'Fetch from API' }}
          </button>
          <button @click="openCreateModal" class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Model
          </button>
        </div>
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Model Code</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Default</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="model in filteredModels" :key="model.id" :class="model.isDefault ? 'bg-amber-50/30' : ''" class="transition-colors hover:bg-gray-50/50">
                <td class="px-5 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" :class="model.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'"></div>
                    <span class="text-sm font-medium text-gray-900">{{ model.name }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <code class="bg-gray-50 text-gray-600 px-2 py-1 rounded-md text-xs font-mono">{{ model.modelCode }}</code>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <button @click="toggleStatus(model)" :class="model.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-75 transition-opacity">
                    {{ model.status }}
                  </button>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <button v-if="!model.isDefault" @click="setAsDefault(model.id)" class="text-gray-300 hover:text-amber-500 transition-colors" title="Set as default">
                    <StarIcon class="w-4 h-4" />
                  </button>
                  <span v-else class="text-amber-500" title="Default model">
                    <StarIcon class="w-4 h-4 fill-current" />
                  </span>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <span class="text-xs text-gray-400">{{ formatDate(model.updatedAt) }}</span>
                </td>
                <td class="px-5 py-4 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button @click="handleEdit(model)" class="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="handleDelete(model.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
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
    </template>

    <!-- Create/Edit Modal -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingModel ? 'Edit Model' : 'Add Model' }}</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="e.g. GPT-4 Turbo" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Model Code</label>
              <input v-model="form.modelCode" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-mono" placeholder="e.g. gpt-4-turbo" />
              <p class="text-xs text-gray-400 mt-1">Exact model identifier from provider</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select v-model="form.status" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isDefault" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              <span class="text-sm text-gray-700">Set as default model</span>
            </label>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50" :disabled="submitting">{{ submitting ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { PlusIcon, CpuChipIcon, ArrowPathIcon, StarIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const route = useRoute()
const providerId = parseInt(route.params.id)
const provider = ref(null)
const models = ref([])
const loading = ref(true)
const fetching = ref(false)
const showCreateModal = ref(false)
const editingModel = ref(null)
const submitting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const form = ref({ name: '', modelCode: '', status: 'active', isDefault: false })

const filteredModels = computed(() => {
  let result = models.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m => m.name.toLowerCase().includes(q) || m.modelCode.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter(m => m.status === statusFilter.value)
  }
  return result
})

const defaultModel = computed(() => {
  return models.value.find(m => m.isDefault) || null
})

onMounted(async () => {
  try {
    const [providerData, modelsData] = await Promise.all([
      adminService.getProvider(providerId),
      adminService.getProviderModels(providerId)
    ])
    provider.value = providerData
    models.value = modelsData || []
  } catch (error) {
    console.error('Failed to load data:', error)
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

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const openCreateModal = () => {
  editingModel.value = null
  form.value = { name: '', modelCode: '', status: 'active', isDefault: false }
  showCreateModal.value = true
}

const handleFetchModels = async () => {
  fetching.value = true
  try {
    const fetchedModels = await adminService.fetchProviderModels(providerId)
    if (!fetchedModels || fetchedModels.length === 0) {
      alert('No models found from provider API')
      return
    }
    let addedCount = 0
    for (const model of fetchedModels) {
      try {
        await adminService.createProviderModel(providerId, {
          name: model.name,
          modelCode: model.modelCode,
          status: 'active',
          isDefault: false
        })
        addedCount++
      } catch (error) {
        console.warn(`Failed to add model ${model.modelCode}:`, error.message)
      }
    }
    alert(`Successfully added ${addedCount} model(s)`)
    models.value = await adminService.getProviderModels(providerId)
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch models'
    alert(errorMsg)
  } finally {
    fetching.value = false
  }
}

const toggleStatus = async (model) => {
  try {
    const newStatus = model.status === 'active' ? 'inactive' : 'active'
    await adminService.updateProviderModel(model.id, { status: newStatus })
    model.status = newStatus
  } catch (error) {
    alert('Failed to update status')
  }
}

const setAsDefault = async (modelId) => {
  try {
    for (const model of models.value) {
      if (model.isDefault) {
        await adminService.updateProviderModel(model.id, { isDefault: false })
      }
    }
    await adminService.updateProviderModel(modelId, { isDefault: true })
    models.value.forEach(m => m.isDefault = (m.id === modelId))
  } catch (error) {
    alert('Failed to set default model')
  }
}

const handleEdit = (model) => {
  editingModel.value = model
  form.value = { name: model.name, modelCode: model.modelCode, status: model.status, isDefault: model.isDefault }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingModel.value) {
      await adminService.updateProviderModel(editingModel.value.id, form.value)
    } else {
      await adminService.createProviderModel(providerId, form.value)
    }
    closeModal()
    models.value = await adminService.getProviderModels(providerId)
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to save model'
    alert(errorMsg)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this model?')) return
  try {
    await adminService.deleteProviderModel(id)
    models.value = models.value.filter(m => m.id !== id)
  } catch (error) {
    alert('Failed to delete model')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingModel.value = null
  form.value = { name: '', modelCode: '', status: 'active', isDefault: false }
}
</script>
