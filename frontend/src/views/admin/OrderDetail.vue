<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <router-link to="/admin/orders" class="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-2">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Orders
          </router-link>
          <h2 class="text-lg font-medium">Order Details</h2>
          <p class="text-sm font-mono text-gray-400 mt-1">{{ order?.orderNumber }}</p>
        </div>
        <span v-if="order" :class="getStatusBadge(order.status)">{{ order.status }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading order...</p>
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Order Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- User Info -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Customer Information</h3>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-600">{{ getUserInitials(order.user?.name) }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ order.user?.name || 'N/A' }}</p>
                <p class="text-xs text-gray-400">{{ order.user?.email || '' }}</p>
              </div>
            </div>
          </div>

          <!-- Package & Payment -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Order Summary</h3>
            <div class="space-y-4">
              <div class="flex items-start justify-between pb-4 border-b border-gray-50">
                <div>
                  <p class="text-xs text-gray-400">Package</p>
                  <p class="text-sm font-medium text-gray-900 mt-0.5">{{ order.package?.name || 'N/A' }}</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize mt-1">
                    {{ order.packageType || order.package?.packageType || '—' }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400">Credits</p>
                  <p class="text-sm font-semibold text-gray-900 mt-0.5">{{ order.package?.creditAmount || 0 }}</p>
                </div>
              </div>

              <!-- Pricing Breakdown -->
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Original Price</span>
                  <span class="text-gray-900">{{ formatPrice(order.package?.priceAmount) }}</span>
                </div>
                <div v-if="order.discountAmount > 0" class="flex justify-between text-sm">
                  <span class="text-emerald-600">Coupon Discount</span>
                  <span class="text-emerald-600">-{{ formatPrice(order.discountAmount) }}</span>
                </div>
                <div class="flex justify-between text-sm font-medium pt-2 border-t border-gray-100">
                  <span class="text-gray-900">Total</span>
                  <span class="text-gray-900">{{ formatPrice(order.priceAmount || order.amount) }}</span>
                </div>
              </div>

              <!-- Payment Method -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-400 mb-1">Payment Method</p>
                <p class="text-sm font-medium text-gray-900">{{ order.paymentMethod?.name || '—' }}</p>
                <div v-if="order.paymentMethod" class="mt-2 space-y-1">
                  <p v-if="order.paymentMethod.accountNumber" class="text-xs text-gray-500 font-mono">{{ order.paymentMethod.accountNumber }}</p>
                  <p v-if="order.paymentMethod.accountName" class="text-xs text-gray-400">a.n. {{ order.paymentMethod.accountName }}</p>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="order.notes" class="p-4 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-400 mb-1">Order Notes</p>
                <p class="text-sm text-gray-700">{{ order.notes }}</p>
              </div>
            </div>
          </div>

          <!-- Payment Instructions (Pending) -->
          <div v-if="order.status === 'pending' && order.paymentMethod" class="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-amber-900">Payment Instructions</h4>
                <p class="text-sm text-amber-700 mt-1">{{ order.paymentMethod.instructions }}</p>
              </div>
            </div>
          </div>

          <!-- Payment Proofs -->
          <div v-if="order.paymentProofs && order.paymentProofs.length > 0" class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Payment Proofs ({{ order.paymentProofs.length }})</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                v-for="proof in order.paymentProofs"
                :key="proof.id"
                class="group relative border border-gray-100 rounded-lg overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
                @click="openProofModal(proof)"
              >
                <img :src="getProofUrl(proof.fileUrl)" :alt="proof.originalName" class="w-full h-40 object-cover" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div class="p-2 bg-white">
                  <p class="text-xs text-gray-500 truncate">{{ proof.originalName }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Rejection Reason -->
          <div v-if="order.status === 'rejected' && order.rejectionReason" class="bg-white rounded-xl border border-rose-100 p-6">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-rose-900">Order Rejected</h4>
                <p class="text-sm text-rose-700 mt-1">{{ order.rejectionReason }}</p>
                <p class="text-xs text-rose-400 mt-2" v-if="order.approvedAt">Rejected {{ formatDate(order.approvedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Timeline & Actions -->
        <div class="space-y-6">
          <!-- Timeline -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Order Timeline</h3>
            <div class="space-y-4">
              <div class="flex gap-3">
                <div class="w-2 h-2 rounded-full bg-gray-900 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p class="text-xs font-medium text-gray-900">Order Created</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(order.createdAt) }}</p>
                </div>
              </div>
              <div v-if="order.paymentProofs && order.paymentProofs.length > 0" class="flex gap-3">
                <div class="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p class="text-xs font-medium text-gray-900">Payment Proof Uploaded</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(order.paymentProofs[0].createdAt) }}</p>
                </div>
              </div>
              <div v-if="order.status === 'approved'" class="flex gap-3">
                <div class="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p class="text-xs font-medium text-emerald-700">Order Approved</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(order.approvedAt) }}</p>
                </div>
              </div>
              <div v-if="order.status === 'rejected'" class="flex gap-3">
                <div class="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p class="text-xs font-medium text-rose-700">Order Rejected</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(order.approvedAt) }}</p>
                </div>
              </div>
              <div v-if="order.status === 'pending'" class="flex gap-3">
                <div class="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-pulse"></div>
                <div>
                  <p class="text-xs font-medium text-amber-700">Awaiting Approval</p>
                  <p class="text-xs text-gray-400 mt-0.5">Order is pending review</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="order.status === 'pending'" class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Actions</h3>
            <div class="space-y-3">
              <button @click="handleApprove" class="w-full py-2.5 px-4 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Approve Order
              </button>
              <button @click="handleReject" class="w-full py-2.5 px-4 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Payment Proof Modal -->
    <transition name="slide-up">
      <div v-if="showProofModal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" @click="showProofModal = false">
        <div class="relative max-w-3xl w-full" @click.stop>
          <button @click="showProofModal = false" class="absolute -top-10 right-0 text-white hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img :src="getProofUrl(selectedProof?.fileUrl)" :alt="selectedProof?.originalName" class="w-full rounded-xl" />
          <p class="text-center text-sm text-white mt-3">{{ selectedProof?.originalName }}</p>
        </div>
      </div>
    </transition>

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
              <p class="text-xs text-gray-400">{{ order?.orderNumber }}</p>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminService } from '../../services/adminService'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)

// Proof modal
const showProofModal = ref(false)
const selectedProof = ref(null)

// Rejection modal
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejecting = ref(false)

onMounted(async () => {
  try {
    order.value = await adminService.getOrder(route.params.id)
  } catch (error) {
    console.error('Failed to load order:', error)
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
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getProofUrl = (fileUrl) => {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http')) return fileUrl
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005/api'
  const baseUrl = apiUrl.replace(/\/api$/, '')
  return `${baseUrl}${fileUrl}`
}

const getStatusBadge = (status) => {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium'
  const map = {
    pending: 'bg-amber-500/20 text-amber-300',
    approved: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-rose-500/20 text-rose-300',
    expired: 'bg-gray-500/20 text-gray-300',
  }
  return `${base} ${map[status] || 'bg-gray-500/20 text-gray-300'}`
}

const openProofModal = (proof) => {
  selectedProof.value = proof
  showProofModal.value = true
}

const handleApprove = async () => {
  if (!confirm('Approve this order? Credits will be added to the user account.')) return
  try {
    await adminService.approveOrder(route.params.id)
    order.value = await adminService.getOrder(route.params.id)
  } catch (error) {
    console.error('Failed to approve order:', error)
    alert(error.response?.data?.message || 'Failed to approve order')
  }
}

const handleReject = () => {
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) return
  rejecting.value = true
  try {
    await adminService.rejectOrder(route.params.id, rejectReason.value.trim())
    order.value = await adminService.getOrder(route.params.id)
    showRejectModal.value = false
  } catch (error) {
    console.error('Failed to reject order:', error)
    alert(error.response?.data?.message || 'Failed to reject order')
  } finally {
    rejecting.value = false
  }
}
</script>
