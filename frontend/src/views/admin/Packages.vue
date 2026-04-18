<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Packages</h2>
          <p class="text-sm text-gray-400 mt-1">Manage subscription and credit packages</p>
        </div>
        <button @click="openCreateModal" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Package
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Packages</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ packages.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Credit</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ packages.filter(p => (p.packageType || p.type) === 'credit').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-violet-600">Duration</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ packages.filter(p => (p.packageType || p.type) === 'duration').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-amber-600">BYOK</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ packages.filter(p => (p.packageType || p.type) === 'byok').length }}</p>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading packages...</p>
    </div>

    <div v-else-if="packages.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <ShoppingBagIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No packages found</h3>
      <p class="text-xs text-gray-500">Create your first subscription package.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="pkg in packages" :key="pkg.id" class="transition-colors hover:bg-gray-50/50">
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="getTypeBg(pkg.packageType || pkg.type)">
                    <ShoppingBagIcon class="w-4 h-4" :class="getTypeColor(pkg.packageType || pkg.type)" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ pkg.name }}</p>
                    <p v-if="pkg.description" class="text-xs text-gray-400 truncate max-w-[200px]">{{ pkg.description }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="getTypeBadge(pkg.packageType || pkg.type)">{{ (pkg.packageType || pkg.type) }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-gray-900">{{ formatPrice(pkg.priceAmount || pkg.price) }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600">{{ pkg.creditAmount }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600">{{ pkg.durationDays }} days</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="pkg.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ pkg.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="handleEdit(pkg)" class="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="handleDelete(pkg.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
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

    <!-- Create/Edit Modal -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingPackage ? 'Edit Package' : 'Create Package' }}</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="e.g. Starter Pack" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select v-model="form.packageType" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="credit">Credit</option>
                <option value="duration">Subscription</option>
                <option value="byok">BYOK</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Price (IDR)</label>
                <input v-model.number="form.priceAmount" type="number" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Credits</label>
                <input v-model.number="form.creditAmount" type="number" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Duration (days)</label>
                <input v-model.number="form.durationDays" type="number" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select v-model="form.status" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Description <span class="text-gray-400">(Optional)</span></label>
              <textarea v-model="form.description" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" rows="2"></textarea>
            </div>
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
import { ref, onMounted } from 'vue'
import { PlusIcon, ShoppingBagIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const packages = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingPackage = ref(null)
const submitting = ref(false)
const form = ref({ name: '', packageType: 'credit', priceAmount: 0, creditAmount: 0, durationDays: 30, description: '', status: 'active' })

onMounted(async () => {
  try {
    packages.value = await adminService.getPackages()
  } catch (error) {
    console.error('Failed to load packages:', error)
  } finally {
    loading.value = false
  }
})

const formatPrice = (amount) => {
  return new Intl.NumberFormat('id-ID').format(amount || 0)
}

const getTypeBg = (type) => {
  const map = { credit: 'bg-emerald-100', duration: 'bg-violet-100', byok: 'bg-amber-100' }
  return map[type] || 'bg-gray-100'
}

const getTypeColor = (type) => {
  const map = { credit: 'text-emerald-700', duration: 'text-violet-700', byok: 'text-amber-700' }
  return map[type] || 'text-gray-700'
}

const getTypeBadge = (type) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize'
  const map = { credit: 'bg-emerald-50 text-emerald-700', duration: 'bg-violet-50 text-violet-700', byok: 'bg-amber-50 text-amber-700' }
  return `${base} ${map[type] || 'bg-gray-50 text-gray-600'}`
}

const openCreateModal = () => {
  editingPackage.value = null
  form.value = { name: '', packageType: 'credit', priceAmount: 0, creditAmount: 0, durationDays: 30, description: '', status: 'active' }
  showCreateModal.value = true
}

const handleEdit = (pkg) => {
  editingPackage.value = pkg
  form.value = {
    name: pkg.name,
    packageType: pkg.packageType || pkg.type,
    priceAmount: pkg.priceAmount || pkg.price,
    creditAmount: pkg.creditAmount,
    durationDays: pkg.durationDays,
    description: pkg.description || '',
    status: pkg.status || 'active'
  }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingPackage.value) {
      await adminService.updatePackage(editingPackage.value.id, form.value)
    } else {
      await adminService.createPackage(form.value)
    }
    closeModal()
    packages.value = await adminService.getPackages()
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to save package')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this package?')) return
  try {
    await adminService.deletePackage(id)
    packages.value = packages.value.filter(p => p.id !== id)
  } catch (error) {
    alert('Failed to delete package')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingPackage.value = null
  form.value = { name: '', packageType: 'credit', priceAmount: 0, creditAmount: 0, durationDays: 30, description: '', status: 'active' }
}
</script>
