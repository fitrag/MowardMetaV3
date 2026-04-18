<template>
  <div class="max-w-4xl mx-auto space-y-5">
    <router-link to="/operator/orders" class="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors duration-150">← Back to Orders</router-link>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm text-gray-400">Loading...</span>
    </div>

    <template v-else-if="order">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ order.orderNumber }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(order.createdAt) }}</p>
          </div>
          <span :class="getOrderStatusBadge(order.status)">{{ order.status }}</span>
        </div>

        <div class="grid grid-cols-2 gap-5 p-4 rounded-lg border border-gray-100">
          <div>
            <p class="text-xs text-gray-500">User</p>
            <p class="text-sm font-medium text-gray-900">{{ order.user?.name }}</p>
            <p class="text-xs text-gray-500">{{ order.user?.email }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Package</p>
            <p class="text-sm font-medium text-gray-900">{{ order.package?.name }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Amount</p>
            <p class="text-sm font-medium text-gray-900">{{ order.package?.currency }} {{ order.package?.priceAmount }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Payment Method</p>
            <p class="text-sm font-medium text-gray-900">{{ order.paymentMethod?.name }}</p>
          </div>
        </div>
      </div>

      <div v-if="order.paymentProofs && order.paymentProofs.length > 0" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Proofs</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="proof in order.paymentProofs" :key="proof.id" class="border border-gray-100 rounded-lg overflow-hidden">
            <img :src="proof.fileUrl" :alt="proof.fileName" class="w-full h-32 object-cover" />
            <div class="p-2">
              <p class="text-xs text-gray-500 truncate">{{ proof.fileName }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="order.status === 'pending'" class="flex space-x-3">
        <button @click="handleApprove" class="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150">Approve Order</button>
        <button @click="handleReject" class="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-red-600 hover:bg-red-50 transition-colors duration-150">Reject Order</button>
      </div>

      <div v-if="order.status === 'rejected' && order.rejectionReason" class="bg-white rounded-xl border border-red-100 shadow-sm p-5">
        <h3 class="text-sm font-medium text-red-800 mb-1">Rejected</h3>
        <p class="text-sm text-red-600">{{ order.rejectionReason }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { operatorService } from '../../services/publicService'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    order.value = await operatorService.getOrder(route.params.id)
  } catch (error) {
    console.error('Failed to load order:', error)
  } finally {
    loading.value = false
  }
})

const handleApprove = async () => {
  if (!confirm('Approve this order?')) return
  try {
    await operatorService.approveOrder(route.params.id)
    order.value = await operatorService.getOrder(route.params.id)
  } catch (error) {
    alert('Failed to approve order')
  }
}

const handleReject = async () => {
  const reason = prompt('Enter rejection reason:')
  if (!reason) return
  try {
    await operatorService.rejectOrder(route.params.id, reason)
    order.value = await operatorService.getOrder(route.params.id)
  } catch (error) {
    alert('Failed to reject order')
  }
}

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const getOrderStatusBadge = (status) => {
  const statusMap = {
    pending: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700',
    approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700',
    rejected: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700',
    expired: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600'
  }
  return statusMap[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600'
}
</script>
