<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <h2 class="text-lg font-medium">Top Up Credits</h2>
      <p class="text-sm text-gray-400 mt-1">Add credits to your account. Credits never expire and can be used for metadata generation.</p>
    </div>

    <!-- Current Credit -->
    <div v-if="creditsInfo" class="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
      <div>
        <p class="text-xs text-gray-400">Current Credits</p>
        <p class="text-2xl font-bold text-gray-900">{{ creditsInfo.currentCredit || 0 }}</p>
      </div>
      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-900 text-white capitalize">{{ creditsInfo.accountType }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-2 text-sm text-gray-400">Loading top-up options...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="packages.length === 0" class="flex flex-col items-center justify-center py-20">
      <BoltIcon class="w-12 h-12 text-gray-200 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No top-up packages available</h3>
      <p class="text-xs text-gray-400">Check back later for new packages</p>
    </div>

    <!-- Packages Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(pkg, index) in packages"
        :key="pkg.id"
        class="relative bg-white rounded-xl border transition-all duration-200 hover:shadow-md"
        :class="isFeatured(pkg) ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100 hover:border-gray-200'"
      >
        <!-- Featured Badge -->
        <div v-if="isFeatured(pkg)" class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-900 text-white">
            <StarIcon class="w-3 h-3 mr-1" />
            Best Value
          </span>
        </div>

        <div class="p-6">
          <!-- Package Header -->
          <div class="mb-5">
            <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
              <BoltIcon class="w-5 h-5 text-emerald-700" />
            </div>
            <h3 class="text-base font-semibold text-gray-900">{{ pkg.name }}</h3>
            <p v-if="pkg.description" class="text-xs text-gray-400 mt-1">{{ pkg.description }}</p>
          </div>

          <!-- Price -->
          <div class="mb-5 pb-5 border-b border-gray-100">
            <div class="flex items-baseline gap-1">
              <span class="text-xs text-gray-400">{{ pkg.currency }}</span>
              <span class="text-2xl font-bold text-gray-900">{{ formatPrice(pkg.priceAmount) }}</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">
              {{ formatPrice(Math.round(pkg.priceAmount / pkg.creditAmount)) }} / credit
            </p>
          </div>

          <!-- Features -->
          <div class="space-y-2.5 mb-6">
            <div class="flex items-center gap-2.5">
              <CheckCircleIcon class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span class="text-sm text-gray-700">{{ pkg.creditAmount }} Credits</span>
            </div>
            <div class="flex items-center gap-2.5">
              <CheckCircleIcon class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span class="text-sm text-gray-700">Credits never expire</span>
            </div>
          </div>

          <!-- Purchase Button -->
          <button
            @click="openPaymentModal(pkg)"
            :disabled="purchasing"
            class="w-full py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="isFeatured(pkg)
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'"
          >
            {{ purchasing ? 'Processing...' : 'Top Up Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="bg-white rounded-xl border border-gray-100 p-6">
      <h3 class="text-sm font-medium text-gray-900 mb-4">How it works</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-violet-700">1</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Choose Amount</p>
            <p class="text-xs text-gray-400 mt-0.5">Select a top-up package</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-amber-700">2</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Make Payment</p>
            <p class="text-xs text-gray-400 mt-0.5">Follow payment instructions</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-emerald-700">3</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Credits Added</p>
            <p class="text-xs text-gray-400 mt-0.5">Credits added once payment is approved</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Method Selection Modal -->
    <transition name="slide-up">
      <div v-if="showPaymentModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closePaymentModal">
        <div class="bg-white rounded-xl max-w-lg w-full p-6" @click.stop>
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-base font-semibold text-gray-900">Choose Payment Method</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ selectedPackage?.name }} · {{ selectedPackage?.currency }} {{ selectedPackage ? formatPrice(selectedPackage.priceAmount) : '' }}</p>
            </div>
            <button @click="closePaymentModal" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Coupon Code -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">Coupon Code <span class="text-gray-400">(Optional)</span></label>
            <div class="flex gap-2">
              <input v-model="couponCode" type="text" placeholder="Enter code" class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 uppercase" @keyup.enter="applyCoupon" />
              <button @click="applyCoupon" :disabled="!couponCode || applyingCoupon" class="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50">
                {{ applyingCoupon ? '...' : 'Apply' }}
              </button>
            </div>
            <p v-if="couponError" class="text-xs text-rose-500 mt-1">{{ couponError }}</p>
            <div v-if="couponApplied" class="flex items-center gap-2 mt-2 p-2 bg-emerald-50 rounded-lg">
              <CheckCircleIcon class="w-4 h-4 text-emerald-600" />
              <span class="text-xs text-emerald-700">Discount: {{ formatPrice(couponDiscount) }} saved!</span>
            </div>
          </div>

          <!-- Loading payment methods -->
          <div v-if="loadingMethods" class="flex items-center justify-center py-8">
            <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2 text-sm text-gray-400">Loading payment methods...</span>
          </div>

          <!-- No payment methods -->
          <div v-else-if="paymentMethods.length === 0" class="text-center py-8">
            <CreditCardIcon class="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p class="text-sm text-gray-400">No payment methods available</p>
          </div>

          <!-- Payment methods list -->
          <div v-else class="space-y-3 mb-5">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="border rounded-xl p-4 cursor-pointer transition-all duration-150"
              :class="selectedPaymentMethod?.id === method.id
                ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'"
              @click="selectedPaymentMethod = method"
            >
              <div class="flex items-start gap-3">
                <!-- Radio indicator -->
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                  :class="selectedPaymentMethod?.id === method.id ? 'border-gray-900' : 'border-gray-300'">
                  <div v-if="selectedPaymentMethod?.id === method.id" class="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-gray-900">{{ method.name }}</p>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                      {{ method.type === 'bank_transfer' ? 'Bank' : method.type === 'e_wallet' ? 'E-Wallet' : method.type }}
                    </span>
                  </div>
                  <div class="mt-1.5 space-y-0.5">
                    <p v-if="method.accountNumber" class="text-xs text-gray-500 font-mono">{{ method.accountNumber }}</p>
                    <p v-if="method.accountName" class="text-xs text-gray-400">a.n. {{ method.accountName }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="closePaymentModal"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              @click="confirmPurchase"
              :disabled="!selectedPaymentMethod || purchasing"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ purchasing ? 'Processing...' : 'Continue' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BoltIcon, CheckCircleIcon, StarIcon, CreditCardIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'

const router = useRouter()
const packages = ref([])
const loading = ref(true)
const purchasing = ref(false)
const creditsInfo = ref(null)

// Payment modal state
const showPaymentModal = ref(false)
const selectedPackage = ref(null)
const paymentMethods = ref([])
const selectedPaymentMethod = ref(null)
const loadingMethods = ref(false)

// Coupon state
const couponCode = ref('')
const couponApplied = ref(false)
const couponDiscount = ref(0)
const couponError = ref('')
const applyingCoupon = ref(false)

onMounted(async () => {
  try {
    const allPackages = await userService.getPackages()
    packages.value = allPackages.filter(pkg => pkg.packageType === 'credit' && pkg.status === 'active')
  } catch (error) {
    console.error('Failed to load packages:', error)
  } finally {
    loading.value = false
  }

  try {
    creditsInfo.value = await userService.getCredits()
  } catch (error) {
    console.error('Failed to load credits:', error)
  }
})

const isFeatured = (pkg) => {
  return pkg.creditAmount >= 50
}

const openPaymentModal = async (pkg) => {
  selectedPackage.value = pkg
  selectedPaymentMethod.value = null
  couponCode.value = ''
  couponApplied.value = false
  couponDiscount.value = 0
  couponError.value = ''
  showPaymentModal.value = true

  if (paymentMethods.value.length === 0) {
    loadingMethods.value = true
    try {
      paymentMethods.value = await userService.getPaymentMethods()
    } catch (error) {
      console.error('Failed to load payment methods:', error)
    } finally {
      loadingMethods.value = false
    }
  }
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  selectedPackage.value = null
  selectedPaymentMethod.value = null
  couponCode.value = ''
  couponApplied.value = false
  couponDiscount.value = 0
  couponError.value = ''
}

const applyCoupon = async () => {
  if (!couponCode.value || !selectedPackage.value) return
  applyingCoupon.value = true
  couponError.value = ''
  couponApplied.value = false
  couponDiscount.value = 0
  try {
    const res = await userService.validateCoupon(couponCode.value, selectedPackage.value.id)
    couponApplied.value = true
    couponDiscount.value = res.discountAmount
  } catch (error) {
    couponError.value = error.response?.data?.message || error.message || 'Invalid coupon'
  } finally {
    applyingCoupon.value = false
  }
}

const confirmPurchase = async () => {
  if (!selectedPackage.value || !selectedPaymentMethod.value) return

  purchasing.value = true
  try {
    const order = await userService.createOrder(selectedPackage.value.id, selectedPaymentMethod.value.id, couponApplied.value ? couponCode.value : null)
    closePaymentModal()
    router.push(`/user/orders/${order.id}`)
  } catch (error) {
    console.error('Failed to create order:', error)
    alert('Failed to create order')
  } finally {
    purchasing.value = false
  }
}

const formatPrice = (price) => {
  return price ? new Intl.NumberFormat('id-ID').format(price) : '0'
}
</script>
