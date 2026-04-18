<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Order Management</h2>
          <p class="text-sm text-gray-400 mt-1">Review and manage all user orders</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Orders</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ orders.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-amber-600">Pending</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.pending }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Approved</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.approved }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-rose-600">Rejected</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.rejected }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Revenue</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ formatPrice(stats.totalRevenue) }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-100 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" type="text" placeholder="Search by order #, user name, or email..." class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
          </div>
        </div>
        <div class="flex gap-2">
          <select v-model="statusFilter" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          <select v-model="typeFilter" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="duration">Duration</option>
            <option value="byok">BYOK</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        <p class="mt-3 text-sm text-gray-400">Loading orders...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="text-center py-12">
        <DocumentIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 class="text-sm font-medium text-gray-900 mb-1">No orders found</h3>
        <p class="text-xs text-gray-500">Try adjusting your filters</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="order in filteredOrders" :key="order.id" class="transition-colors hover:bg-gray-50/50">
              <td class="px-5 py-4 whitespace-nowrap">
                <router-link :to="`/admin/orders/${order.id}`" class="text-sm font-mono font-medium text-gray-900 hover:text-violet-600 transition-colors">
                  {{ order.orderNumber?.slice(0, 20) || '' }}...
                </router-link>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-semibold text-gray-600">{{ getUserInitials(order.user?.name) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate max-w-[150px]">{{ order.user?.name || 'N/A' }}</p>
                    <p class="text-xs text-gray-400 truncate max-w-[150px]">{{ order.user?.email || '' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ order.package?.name || 'N/A' }}</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize mt-0.5">
                    {{ order.packageType || order.package?.packageType || '—' }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div>
                  <div v-if="order.discountAmount > 0">
                    <p class="text-xs text-gray-400 line-through">{{ formatPrice(order.package?.priceAmount) }}</p>
                    <p class="text-sm font-semibold text-gray-900">{{ formatPrice(order.priceAmount) }}</p>
                    <p class="text-xs text-emerald-500">-{{ formatPrice(order.discountAmount) }}</p>
                  </div>
                  <p v-else class="text-sm font-medium text-gray-900">{{ formatPrice(order.priceAmount || order.amount) }}</p>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-600">{{ order.paymentMethod?.name || '—' }}</p>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="getStatusBadge(order.status)">{{ order.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <p class="text-xs text-gray-500">{{ formatDate(order.createdAt) }}</p>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-1">
                  <router-link :to="`/admin/orders/${order.id}`" class="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="View details">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </router-link>
                  <template v-if="order.status === 'pending'">
                    <button @click="handleApprove(order.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button @click="handleReject(order)" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Reject">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rejection Modal -->
    <transition name="slide-up">
      <div v-if="showRejectModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="showRejectModal = false">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">Reject Order</h3>
              <p class="text-xs text-gray-400">{{ rejectingOrder?.orderNumber }}</p>
            </div>
          </div>
          <textarea v-model="rejectReason" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" rows="3" placeholder="Enter rejection reason..."></textarea>
          <div class="flex gap-3 mt-4">
            <button @click="showRejectModal = false" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button @click="confirmReject" :disabled="!rejectReason.trim() || rejecting" class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50">
              {{ rejecting ? 'Processing...' : 'Reject Order' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DocumentIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const orders = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

// Rejection modal
const showRejectModal = ref(false)
const rejectingOrder = ref(null)
const rejectReason = ref('')
const rejecting = ref(false)

const stats = computed(() => {
  return {
    pending: orders.value.filter(o => o.status === 'pending').length,
    approved: orders.value.filter(o => o.status === 'approved').length,
    rejected: orders.value.filter(o => o.status === 'rejected').length,
    totalRevenue: orders.value.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.priceAmount || o.amount || 0), 0),
  }
})

const filteredOrders = computed(() => {
  let result = orders.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(o =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q)
    )
  }

  if (statusFilter.value) {
    result = result.filter(o => o.status === statusFilter.value)
  }

  if (typeFilter.value) {
    result = result.filter(o => (o.packageType || o.package?.packageType) === typeFilter.value)
  }

  return result
})

onMounted(async () => {
  try {
    orders.value = await adminService.getOrders()
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
})

const getUserInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatPrice = (price) => {
  return price ? new Intl.NumberFormat('id-ID').format(price) : '0'
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
  const map = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    expired: 'bg-gray-100 text-gray-500',
  }
  return `${base} ${map[status] || 'bg-gray-50 text-gray-600'}`
}

const handleApprove = async (orderId) => {
  if (!confirm('Approve this order? Credits will be added to the user account.')) return
  try {
    await adminService.approveOrder(orderId)
    orders.value = await adminService.getOrders()
  } catch (error) {
    console.error('Failed to approve order:', error)
    alert(error.response?.data?.message || 'Failed to approve order')
  }
}

const handleReject = (order) => {
  rejectingOrder.value = order
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectingOrder.value || !rejectReason.value.trim()) return
  rejecting.value = true
  try {
    await adminService.rejectOrder(rejectingOrder.value.id, rejectReason.value.trim())
    orders.value = await adminService.getOrders()
    showRejectModal.value = false
  } catch (error) {
    console.error('Failed to reject order:', error)
    alert(error.response?.data?.message || 'Failed to reject order')
  } finally {
    rejecting.value = false
  }
}
</script>
