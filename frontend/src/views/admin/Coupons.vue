<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Coupons</h2>
          <p class="text-sm text-gray-400 mt-1">Manage discount codes for orders</p>
        </div>
        <button @click="openCreateModal" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Coupon
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Coupons</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ coupons.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Active</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ coupons.filter(c => c.status === 'active').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Percentage</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ coupons.filter(c => c.discountType === 'percentage').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Fixed</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ coupons.filter(c => c.discountType === 'fixed').length }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-xl border border-gray-100 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search by code or name..." class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
        </div>
        <select v-model="statusFilter" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading coupons...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCoupons.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <TicketIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No coupons found</h3>
      <p class="text-xs text-gray-500">Create your first coupon code.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Coupon</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Validity</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="coupon in filteredCoupons" :key="coupon.id" class="transition-colors hover:bg-gray-50/50">
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <TicketIcon class="w-4 h-4 text-violet-700" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ coupon.code }}</p>
                    <p v-if="coupon.name" class="text-xs text-gray-400">{{ coupon.name }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div>
                  <span class="text-sm font-semibold text-gray-900">
                    {{ coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue) }}
                  </span>
                  <span v-if="coupon.discountType === 'percentage' && coupon.maxDiscountAmount" class="text-xs text-gray-400 ml-1">(max {{ formatCurrency(coupon.maxDiscountAmount) }})</span>
                </div>
                <div v-if="coupon.minPurchaseAmount > 0" class="text-xs text-gray-400 mt-0.5">Min purchase: {{ formatCurrency(coupon.minPurchaseAmount) }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ coupon.usageCount }} / {{ coupon.usageLimit || '∞' }}</div>
                <div v-if="coupon.usageLimitPerUser > 1" class="text-xs text-gray-400 mt-0.5">{{ coupon.usageLimitPerUser }}x per user</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ formatDateRange(coupon.validFrom, coupon.validUntil) }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="getStatusBadge(coupon.status)">{{ coupon.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEditModal(coupon)" class="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="handleDelete(coupon.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
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
      <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingCoupon ? 'Edit Coupon' : 'Create Coupon' }}</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Code</label>
                <input v-model="form.code" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 uppercase" placeholder="SAVE20" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" placeholder="Summer Sale" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Discount Type</label>
                <select v-model="form.discountType" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Discount Value</label>
                <input v-model.number="form.discountValue" type="number" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" :placeholder="form.discountType === 'percentage' ? '20' : '50000'" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Min Purchase <span class="text-gray-400">(IDR)</span></label>
                <input v-model.number="form.minPurchaseAmount" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" placeholder="0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Max Discount <span class="text-gray-400">(IDR)</span></label>
                <input v-model.number="form.maxDiscountAmount" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" placeholder="No limit" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Usage Limit</label>
                <input v-model.number="form.usageLimit" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="0" placeholder="Unlimited" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Per User Limit</label>
                <input v-model.number="form.usageLimitPerUser" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" min="1" placeholder="1" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Valid From</label>
                <input v-model="form.validFrom" type="datetime-local" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Valid Until</label>
                <input v-model="form.validUntil" type="datetime-local" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Applicable Package Types</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" :checked="form.applicablePackageTypes.includes('credit')" @change="togglePackageType('credit')" class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  Credit
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" :checked="form.applicablePackageTypes.includes('duration')" @change="togglePackageType('duration')" class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  Duration
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" :checked="form.applicablePackageTypes.includes('byok')" @change="togglePackageType('byok')" class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  BYOK
                </label>
              </div>
              <p class="text-xs text-gray-400 mt-1">Leave empty to apply to all types</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Description <span class="text-gray-400">(Optional)</span></label>
              <textarea v-model="form.description" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" rows="2" placeholder="Coupon description..."></textarea>
            </div>

            <div v-if="editingCoupon">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select v-model="form.status" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
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
import { PlusIcon, TicketIcon } from '@heroicons/vue/24/outline'
import api from '../../services/api'

const coupons = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingCoupon = ref(null)
const submitting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

const defaultForm = () => ({
  code: '',
  name: '',
  discountType: 'percentage',
  discountValue: null,
  minPurchaseAmount: 0,
  maxDiscountAmount: null,
  usageLimit: null,
  usageLimitPerUser: 1,
  validFrom: '',
  validUntil: '',
  applicablePackageTypes: [],
  description: '',
  status: 'active',
})

const form = ref(defaultForm())

const filteredCoupons = computed(() => {
  let result = coupons.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter(c => c.status === statusFilter.value)
  }
  return result
})

onMounted(async () => {
  await loadCoupons()
})

const loadCoupons = async () => {
  try {
    const res = await api.get('/admin/coupons')
    coupons.value = res.data.data
  } catch (error) {
    console.error('Failed to load coupons:', error)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingCoupon.value = null
  form.value = defaultForm()
  showModal.value = true
}

const openEditModal = (coupon) => {
  editingCoupon.value = coupon
  form.value = {
    code: coupon.code,
    name: coupon.name,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minPurchaseAmount: coupon.minPurchaseAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    usageLimit: coupon.usageLimit,
    usageLimitPerUser: coupon.usageLimitPerUser,
    validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 16) : '',
    validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 16) : '',
    applicablePackageTypes: coupon.applicablePackageTypes ? [...coupon.applicablePackageTypes] : [],
    description: coupon.description || '',
    status: coupon.status,
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCoupon.value = null
  form.value = defaultForm()
}

const togglePackageType = (type) => {
  const idx = form.value.applicablePackageTypes.indexOf(type)
  if (idx > -1) {
    form.value.applicablePackageTypes.splice(idx, 1)
  } else {
    form.value.applicablePackageTypes.push(type)
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload = {
      ...form.value,
      maxDiscountAmount: form.value.maxDiscountAmount || null,
      usageLimit: form.value.usageLimit || null,
      validFrom: form.value.validFrom || null,
      validUntil: form.value.validUntil || null,
      applicablePackageTypes: form.value.applicablePackageTypes.length > 0 ? form.value.applicablePackageTypes : null,
    }

    if (editingCoupon.value) {
      await api.patch(`/admin/coupons/${editingCoupon.value.id}`, payload)
    } else {
      await api.post('/admin/coupons', payload)
    }

    await loadCoupons()
    closeModal()
  } catch (error) {
    console.error('Failed to save coupon:', error)
    alert(error.response?.data?.message || 'Failed to save coupon')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this coupon?')) return
  try {
    await api.delete(`/admin/coupons/${id}`)
    await loadCoupons()
  } catch (error) {
    console.error('Failed to delete coupon:', error)
    alert('Failed to delete coupon')
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID').format(amount)
}

const formatDateRange = (from, to) => {
  if (!from && !to) return 'Always'
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const parts = []
  if (from) parts.push(new Date(from).toLocaleDateString('en-US', opts))
  if (to) parts.push(new Date(to).toLocaleDateString('en-US', opts))
  return parts.join(' → ')
}

const getStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const map = {
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-500',
    expired: 'bg-rose-50 text-rose-700',
  }
  return `${base} ${map[status] || 'bg-gray-50 text-gray-600'}`
}
</script>
