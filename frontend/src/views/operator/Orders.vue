<template>
  <div class="space-y-5">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-400">Loading...</span>
      </div>

      <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
        <DocumentIcon class="w-10 h-10 mb-2" />
        <p class="text-sm">No orders found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50/50 transition-colors duration-150">
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ order.user?.name }}</div>
                <div class="text-xs text-gray-500">{{ order.user?.email }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ order.package?.name }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="getOrderStatusBadge(order.status)">{{ order.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatDate(order.createdAt) }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link :to="`/operator/orders/${order.id}`" class="text-violet-600 hover:text-violet-700 transition-colors duration-150 mr-3">
                  View
                </router-link>
                <button v-if="order.status === 'pending'" @click="handleApprove(order.id)" class="text-emerald-600 hover:text-emerald-700 transition-colors duration-150 mr-3">
                  Approve
                </button>
                <button v-if="order.status === 'pending'" @click="handleReject(order)" class="text-rose-600 hover:text-rose-700 transition-colors duration-150">
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DocumentIcon } from '@heroicons/vue/24/outline'
import { operatorService } from '../../services/publicService'

const orders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    orders.value = await operatorService.getOrders()
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const getOrderStatusBadge = (status) => {
  const statusMap = {
    pending: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700',
    approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700',
    rejected: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700',
    expired: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600'
  }
  return statusMap[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600'
}

const handleApprove = async (orderId) => {
  if (!confirm('Approve this order?')) return
  try {
    await operatorService.approveOrder(orderId)
    orders.value = await operatorService.getOrders()
  } catch (error) {
    alert('Failed to approve order')
  }
}

const handleReject = async (order) => {
  const reason = prompt('Enter rejection reason:')
  if (!reason) return
  try {
    await operatorService.rejectOrder(order.id, reason)
    orders.value = await operatorService.getOrders()
  } catch (error) {
    alert('Failed to reject order')
  }
}
</script>
