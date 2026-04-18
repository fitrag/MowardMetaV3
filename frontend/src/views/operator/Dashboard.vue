<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <h2 class="text-lg font-medium">Operator Dashboard</h2>
      <p class="text-sm text-gray-400 mt-1">Manage orders, users, and generations</p>
    </div>

    <!-- Stats Grid -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-5 w-5 text-gray-300 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm text-gray-400">Loading...</span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <UsersIcon class="w-5 h-5 text-white" />
          </div>
          <div class="ml-3">
            <p class="text-xs text-gray-400">Total Users</p>
            <p class="text-xl font-semibold text-gray-900">{{ summary.userCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <DocumentIcon class="w-5 h-5 text-emerald-700" />
          </div>
          <div class="ml-3">
            <p class="text-xs text-gray-400">Total Orders</p>
            <p class="text-xl font-semibold text-gray-900">{{ summary.orderCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <ClockIcon class="w-5 h-5 text-amber-700" />
          </div>
          <div class="ml-3">
            <p class="text-xs text-gray-400">Pending Orders</p>
            <p class="text-xl font-semibold text-gray-900">{{ summary.pendingOrders }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <PhotoIcon class="w-5 h-5 text-violet-700" />
          </div>
          <div class="ml-3">
            <p class="text-xs text-gray-400">Generations</p>
            <p class="text-xl font-semibold text-gray-900">{{ summary.generationCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Orders -->
    <div class="bg-white rounded-xl border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-900">Pending Orders</h3>
        <router-link to="/operator/orders" class="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors duration-150">
          View all →
        </router-link>
      </div>
      
      <div v-if="pendingOrders.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-300">
        <ClockIcon class="w-10 h-10 mb-2" />
        <p class="text-sm">No pending orders</p>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="order in pendingOrders.slice(0, 5)"
          :key="order.id"
          class="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors duration-150"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</p>
            <p class="text-xs text-gray-500">{{ order.user?.name }} · {{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="flex space-x-2">
            <button @click="handleApprove(order.id)" class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-150">Approve</button>
            <button @click="handleReject(order)" class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150">Reject</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UsersIcon, DocumentIcon, ClockIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { operatorService } from '../../services/publicService'

const loading = ref(true)
const summary = ref({
  userCount: 0,
  orderCount: 0,
  pendingOrders: 0,
  generationCount: 0
})
const pendingOrders = ref([])

onMounted(async () => {
  try {
    const [summaryData, ordersData] = await Promise.all([
      operatorService.getDashboardSummary(),
      operatorService.getOrders()
    ])
    
    summary.value = summaryData
    pendingOrders.value = ordersData.filter(o => o.status === 'pending')
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const handleApprove = async (orderId) => {
  if (!confirm('Approve this order?')) return
  
  try {
    await operatorService.approveOrder(orderId)
    pendingOrders.value = pendingOrders.value.filter(o => o.id !== orderId)
    summary.value = await operatorService.getDashboardSummary()
  } catch (error) {
    console.error('Failed to approve order:', error)
    alert('Failed to approve order')
  }
}

const handleReject = async (order) => {
  const reason = prompt('Enter rejection reason:')
  if (!reason) return
  
  try {
    await operatorService.rejectOrder(order.id, reason)
    pendingOrders.value = pendingOrders.value.filter(o => o.id !== order.id)
    summary.value = await operatorService.getDashboardSummary()
  } catch (error) {
    console.error('Failed to reject order:', error)
    alert('Failed to reject order')
  }
}
</script>
