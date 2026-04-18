<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Payment Methods</h2>
          <p class="text-sm text-gray-400 mt-1">Manage payment channels for users</p>
        </div>
        <button @click="openCreateModal" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Payment Method
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Methods</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ paymentMethods.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Active</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ paymentMethods.filter(m => m.status === 'active').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Types</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ uniqueTypes.length }}</p>
      </div>
    </div>

    <!-- Cards -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading payment methods...</p>
    </div>

    <div v-else-if="paymentMethods.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <CreditCardIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No payment methods found</h3>
      <p class="text-xs text-gray-500">Add your first payment method for users.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="method in paymentMethods"
        :key="method.id"
        class="bg-white rounded-xl border transition-all duration-200 hover:shadow-md"
        :class="method.status === 'active' ? 'border-gray-100' : 'border-gray-100 opacity-60'"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getTypeBg(method.type)">
                <CreditCardIcon class="w-5 h-5" :class="getTypeColor(method.type)" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ method.name }}</h3>
                <code class="text-xs text-gray-400 font-mono">{{ method.code }}</code>
              </div>
            </div>
            <span :class="method.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ method.status }}</span>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize" :class="getTypeBadge(method.type)">{{ formatType(method.type) }}</span>
            </div>
            <div v-if="method.accountNumber" class="p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-400">Account Number</p>
              <p class="text-sm font-mono font-medium text-gray-900 mt-0.5">{{ method.accountNumber }}</p>
            </div>
            <div v-if="method.accountName" class="p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-400">Account Name</p>
              <p class="text-sm font-medium text-gray-900 mt-0.5">{{ method.accountName }}</p>
            </div>
          </div>

          <div class="flex gap-2 mt-4 pt-4 border-t border-gray-50">
            <button @click="handleEdit(method)" class="flex-1 py-2 px-3 text-xs font-medium text-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              Edit
            </button>
            <button @click="handleDelete(method.id)" class="py-2 px-3 text-xs font-medium rounded-lg bg-gray-100 text-rose-600 hover:bg-rose-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingMethod ? 'Edit Payment Method' : 'Create Payment Method' }}</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="e.g. BCA" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Code</label>
                <input v-model="form.code" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 lowercase" placeholder="e.g. bca" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select v-model="form.type" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="e_wallet">E-Wallet</option>
                <option value="qris">QRIS</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
                <input v-model="form.accountNumber" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-mono" placeholder="1234567890" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
                <input v-model="form.accountName" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="PT ShowModel" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
              <textarea v-model="form.instructions" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" rows="2" placeholder="Payment instructions for users..."></textarea>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, CreditCardIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const paymentMethods = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingMethod = ref(null)
const submitting = ref(false)
const form = ref({ name: '', code: '', type: 'bank_transfer', accountNumber: '', accountName: '', instructions: '', status: 'active' })

const uniqueTypes = computed(() => [...new Set(paymentMethods.value.map(m => m.type))])

onMounted(async () => {
  try {
    paymentMethods.value = await adminService.getPaymentMethods()
  } catch (error) {
    console.error('Failed to load payment methods:', error)
  } finally {
    loading.value = false
  }
})

const formatType = (type) => {
  const map = { bank_transfer: 'Bank Transfer', e_wallet: 'E-Wallet', qris: 'QRIS', other: 'Other' }
  return map[type] || type
}

const getTypeBg = (type) => {
  const map = { bank_transfer: 'bg-amber-100', e_wallet: 'bg-violet-100', qris: 'bg-emerald-100', other: 'bg-gray-100' }
  return map[type] || 'bg-gray-100'
}

const getTypeColor = (type) => {
  const map = { bank_transfer: 'text-amber-700', e_wallet: 'text-violet-700', qris: 'text-emerald-700', other: 'text-gray-700' }
  return map[type] || 'text-gray-700'
}

const getTypeBadge = (type) => {
  const map = { bank_transfer: 'bg-amber-50 text-amber-700', e_wallet: 'bg-violet-50 text-violet-700', qris: 'bg-emerald-50 text-emerald-700', other: 'bg-gray-100 text-gray-600' }
  return map[type] || 'bg-gray-50 text-gray-600'
}

const openCreateModal = () => {
  editingMethod.value = null
  form.value = { name: '', code: '', type: 'bank_transfer', accountNumber: '', accountName: '', instructions: '', status: 'active' }
  showCreateModal.value = true
}

const handleEdit = (method) => {
  editingMethod.value = method
  form.value = {
    name: method.name,
    code: method.code || '',
    type: method.type,
    accountNumber: method.accountNumber || '',
    accountName: method.accountName || '',
    instructions: method.instructions || '',
    status: method.status
  }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (!form.value.code || form.value.code.trim() === '') {
      alert('Payment method code is required')
      submitting.value = false
      return
    }
    form.value.code = form.value.code.toLowerCase().replace(/\s+/g, '-')
    if (editingMethod.value) {
      await adminService.updatePaymentMethod(editingMethod.value.id, form.value)
    } else {
      await adminService.createPaymentMethod(form.value)
    }
    closeModal()
    paymentMethods.value = await adminService.getPaymentMethods()
  } catch (error) {
    alert(error.response?.data?.error || error.response?.data?.message || 'Failed to save payment method')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this payment method?')) return
  try {
    await adminService.deletePaymentMethod(id)
    paymentMethods.value = paymentMethods.value.filter(m => m.id !== id)
  } catch (error) {
    alert('Failed to delete payment method')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingMethod.value = null
  form.value = { name: '', code: '', type: 'bank_transfer', accountNumber: '', accountName: '', instructions: '', status: 'active' }
}
</script>
