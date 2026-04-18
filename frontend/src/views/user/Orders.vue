<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">My Orders</h2>
          <p class="text-sm text-gray-400 mt-1">Track and manage your purchases</p>
        </div>
        <router-link to="/user/packages" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <ShoppingBagIcon class="w-4 h-4 mr-2" />
          Browse Packages
        </router-link>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Total Orders</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ orders.length }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <DocumentIcon class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-amber-600">Pending</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ pendingCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <ClockIcon class="w-5 h-5 text-amber-700" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-emerald-600">Approved</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ approvedCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon class="w-5 h-5 text-emerald-700" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-rose-600">Rejected</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ rejectedCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <XCircleIcon class="w-5 h-5 text-rose-700" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-100 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="search" type="text" placeholder="Search by order number or package..." class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
        </div>
        <div class="inline-flex bg-gray-50 rounded-lg p-1">
          <button @click="filter = 'all'" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'">All</button>
          <button @click="filter = 'pending'" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-900'">Pending</button>
          <button @click="filter = 'approved'" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'approved' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-900'">Approved</button>
          <button @click="filter = 'rejected'" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'rejected' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-900'">Rejected</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading orders...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrders.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <DocumentIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">{{ search || filter !== 'all' ? 'No matching orders' : 'No orders yet' }}</h3>
      <p class="text-xs text-gray-500 mb-4">{{ search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Purchase a package to get started' }}</p>
      <router-link v-if="!search && filter === 'all'" to="/user/packages" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">
        <ShoppingBagIcon class="w-4 h-4 mr-2" />
        View Packages
      </router-link>
    </div>

    <!-- Order Cards -->
    <div v-else class="space-y-4">
      <router-link
        v-for="order in filteredOrders"
        :key="order.id"
        :to="`/user/orders/${order.id}`"
        class="block bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
      >
        <div class="p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4 flex-1 min-w-0">
              <!-- Status Icon -->
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :class="getStatusIconBg(order.status)">
                <component :is="getStatusIcon(order.status)" class="w-5 h-5" :class="getStatusIconColor(order.status)" />
              </div>

              <div class="flex-1 min-w-0">
                <!-- Top Row: Order number + Status -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <p class="text-sm font-mono font-medium text-gray-900 truncate">{{ order.orderNumber }}</p>
                    <span :class="getOrderStatusBadge(order.status)">{{ order.status }}</span>
                  </div>
                  <svg class="w-4 h-4 text-gray-300 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <!-- Package + Amount Row -->
                <div class="flex items-center gap-6">
                  <div class="min-w-0">
                    <p class="text-sm text-gray-700 truncate">{{ order.package?.name || '—' }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span v-if="order.packageType" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 capitalize">{{ order.packageType }}</span>
                      <span v-if="order.package?.creditAmount" class="text-xs text-gray-400">{{ order.package.creditAmount }} credits</span>
                    </div>
                  </div>

                  <div class="flex-shrink-0 text-right">
                    <div v-if="order.discountAmount > 0">
                      <p class="text-xs text-gray-400 line-through">{{ formatPrice(order.package?.priceAmount) }}</p>
                      <p class="text-sm font-semibold text-gray-900">{{ formatPrice(order.priceAmount || order.amount) }}</p>
                      <p class="text-xs text-emerald-500">-{{ formatPrice(order.discountAmount) }}</p>
                    </div>
                    <p v-else class="text-sm font-semibold text-gray-900">{{ formatPrice(order.priceAmount || order.amount) }}</p>
                  </div>

                  <div class="flex-shrink-0">
                    <p class="text-xs text-gray-400">{{ formatDate(order.createdAt) }}</p>
                  </div>
                </div>

                <!-- Rejection reason -->
                <div v-if="order.status === 'rejected' && order.rejectionReason" class="mt-2 p-2 bg-rose-50 rounded-lg">
                  <p class="text-xs text-rose-600 truncate">{{ order.rejectionReason }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ShoppingBagIcon, DocumentIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'

const orders = ref([])
const loading = ref(true)
const search = ref('')
const filter = ref('all')

onMounted(async () => {
  try {
    orders.value = await userService.getOrders()
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
})

const filteredOrders = computed(() => {
  let result = orders.value
  if (filter.value !== 'all') {
    result = result.filter(o => o.status === filter.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(o =>
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.package?.name || '').toLowerCase().includes(q) ||
      String(o.id).includes(q)
    )
  }
  return result
})

const pendingCount = computed(() => orders.value.filter(o => o.status === 'pending').length)
const approvedCount = computed(() => orders.value.filter(o => o.status === 'approved').length)
const rejectedCount = computed(() => orders.value.filter(o => o.status === 'rejected').length)

const formatPrice = (price) => {
  return price ? new Intl.NumberFormat('id-ID').format(price) : '0'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getOrderStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const map = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-rose-50 text-rose-700', expired: 'bg-gray-100 text-gray-500' }
  return `${base} ${map[status] || 'bg-gray-50 text-gray-600'}`
}

const getStatusIcon = (status) => {
  const map = { pending: ClockIcon, approved: CheckCircleIcon, rejected: XCircleIcon }
  return map[status] || DocumentIcon
}

const getStatusIconBg = (status) => {
  const map = { pending: 'bg-amber-100', approved: 'bg-emerald-100', rejected: 'bg-rose-100' }
  return map[status] || 'bg-gray-100'
}

const getStatusIconColor = (status) => {
  const map = { pending: 'text-amber-700', approved: 'text-emerald-700', rejected: 'text-rose-700' }
  return map[status] || 'text-gray-400'
}
</script>
