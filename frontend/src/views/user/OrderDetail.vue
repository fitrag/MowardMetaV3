<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading order details...</p>
    </div>

    <template v-else-if="order">
      <!-- Header -->
      <div class="bg-gray-950 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link to="/user/orders" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </router-link>
            <div>
              <h2 class="text-lg font-medium">Order Details</h2>
              <p class="text-sm font-mono text-gray-400 mt-1">{{ order.orderNumber }}</p>
            </div>
          </div>
          <span :class="getStatusBadgeDark(order.status)">{{ order.status }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Order Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Package & Pricing -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Order Summary</h3>
            <div class="space-y-4">
              <!-- Package -->
              <div class="flex items-start justify-between pb-4 border-b border-gray-50">
                <div>
                  <p class="text-xs text-gray-400">Package</p>
                  <p class="text-sm font-medium text-gray-900 mt-0.5">{{ order.package?.name || '—' }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span v-if="order.packageType" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">{{ order.packageType }}</span>
                    <span v-if="order.package?.creditAmount" class="text-xs text-gray-400">{{ order.package.creditAmount }} credits</span>
                  </div>
                </div>
                <div v-if="order.package?.description" class="max-w-xs text-right">
                  <p class="text-xs text-gray-400">Description</p>
                  <p class="text-xs text-gray-600 mt-0.5">{{ order.package.description }}</p>
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
            </div>
          </div>

          <!-- Payment Method -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Payment Method</h3>
            <div v-if="order.paymentMethod" class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-900">{{ order.paymentMethod.name }}</p>
              <div class="mt-2 space-y-1">
                <p v-if="order.paymentMethod.accountNumber" class="text-xs text-gray-500 font-mono">{{ order.paymentMethod.accountNumber }}</p>
                <p v-if="order.paymentMethod.accountName" class="text-xs text-gray-400">a.n. {{ order.paymentMethod.accountName }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No payment method selected</p>
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

          <!-- Upload Payment Proof (Pending) -->
          <div v-if="order.status === 'pending'" class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Upload Payment Proof</h3>
            <form @submit.prevent="handleUploadProof" class="space-y-4">
              <div
                class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-150 cursor-pointer"
                @click="$refs.proofInput.click()"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <div v-if="proofPreview" class="flex flex-col items-center">
                  <img :src="proofPreview" alt="Preview" class="w-24 h-24 object-cover rounded-lg mb-3 border border-gray-200" />
                  <p class="text-sm font-medium text-gray-900">{{ proofFile.name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">Click to change</p>
                </div>
                <div v-else>
                  <svg class="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M8 6h.01M20 12a8 8 0 11-16 0 8 8 0 0116 0z" />
                  </svg>
                  <p class="text-sm text-gray-500 mt-2"><span class="text-gray-900 font-medium">Click to upload</span> or drag and drop</p>
                  <p class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP or PDF up to 5MB</p>
                </div>
                <input ref="proofInput" type="file" accept="image/*,application/pdf" @change="handleFileSelect" class="hidden" />
              </div>
              <button type="submit" class="w-full py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!proofFile || uploading">
                {{ uploading ? 'Uploading...' : 'Upload Payment Proof' }}
              </button>
            </form>
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
                <img :src="getProofUrl(proof.fileUrl)" :alt="proof.fileName" class="w-full h-40 object-cover" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div class="p-2 bg-white">
                  <p class="text-xs text-gray-500 truncate">{{ proof.fileName }}</p>
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
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Timeline -->
        <div class="space-y-6">
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

          <!-- Order Info -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Order Info</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-xs text-gray-400">Order ID</span>
                <span class="text-xs font-mono text-gray-600">{{ order.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-gray-400">Created</span>
                <span class="text-xs text-gray-600">{{ formatDate(order.createdAt) }}</span>
              </div>
              <div v-if="order.expiresAt" class="flex justify-between">
                <span class="text-xs text-gray-400">Expires</span>
                <span class="text-xs text-gray-600">{{ formatDate(order.expiresAt) }}</span>
              </div>
              <div v-if="order.notes" class="pt-3 border-t border-gray-50">
                <p class="text-xs text-gray-400 mb-1">Notes</p>
                <p class="text-xs text-gray-600">{{ order.notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <DocumentIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">Order not found</h3>
      <router-link to="/user/orders" class="text-sm text-violet-600 hover:text-violet-700 transition-colors mt-2 inline-block">Back to Orders</router-link>
    </div>

    <!-- Proof Modal -->
    <transition name="slide-up">
      <div v-if="showProofModal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" @click="showProofModal = false">
        <div class="relative max-w-3xl w-full" @click.stop>
          <button @click="showProofModal = false" class="absolute -top-10 right-0 text-white hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img :src="getProofUrl(selectedProof?.fileUrl)" :alt="selectedProof?.fileName" class="w-full rounded-xl" />
          <p class="text-center text-sm text-white mt-3">{{ selectedProof?.fileName }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { DocumentIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'

const route = useRoute()
const order = ref(null)
const loading = ref(true)
const proofFile = ref(null)
const proofPreview = ref(null)
const uploading = ref(false)
const showProofModal = ref(false)
const selectedProof = ref(null)

onMounted(async () => {
  try {
    order.value = await userService.getOrder(route.params.id)
  } catch (error) {
    console.error('Failed to load order:', error)
  } finally {
    loading.value = false
  }
})

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    proofFile.value = file
    proofPreview.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    proofFile.value = file
    proofPreview.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
  }
}

const handleUploadProof = async () => {
  if (!proofFile.value) return
  uploading.value = true
  try {
    await userService.uploadPaymentProof(route.params.id, proofFile.value)
    alert('Payment proof uploaded successfully!')
    order.value = await userService.getOrder(route.params.id)
    proofFile.value = null
    proofPreview.value = null
  } catch (error) {
    alert('Failed to upload payment proof')
  } finally {
    uploading.value = false
  }
}

const openProofModal = (proof) => {
  selectedProof.value = proof
  showProofModal.value = true
}

const formatPrice = (price) => {
  return price ? new Intl.NumberFormat('id-ID').format(price) : '0'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getProofUrl = (fileUrl) => {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http')) return fileUrl
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005/api'
  const baseUrl = apiUrl.replace(/\/api$/, '')
  return `${baseUrl}${fileUrl}`
}

const getStatusBadgeDark = (status) => {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium'
  const map = { pending: 'bg-amber-500/20 text-amber-300', approved: 'bg-emerald-500/20 text-emerald-300', rejected: 'bg-rose-500/20 text-rose-300', expired: 'bg-gray-500/20 text-gray-300' }
  return `${base} ${map[status] || 'bg-gray-500/20 text-gray-300'}`
}
</script>
