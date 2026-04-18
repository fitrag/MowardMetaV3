<template>
  <div class="space-y-6">
    <!-- Dark Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Subscription & Credits</h2>
          <p class="text-sm text-gray-400 mt-1">Manage your credits and subscription packages</p>
        </div>
        <div class="flex items-center gap-3">
          <router-link to="/user/packages" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ShoppingBagIcon class="w-4 h-4 mr-2" />
            View Packages
          </router-link>
          <router-link to="/user/topup" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <PlusIcon class="w-4 h-4 mr-2" />
            Top Up Credits
          </router-link>
        </div>
      </div>

      <!-- Credit Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/10">
        <div>
          <p class="text-xs text-gray-500">Current Credits</p>
          <p class="text-2xl font-bold mt-0.5">{{ credits.currentCredit || 0 }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Account Type</p>
          <p class="text-sm font-medium mt-0.5 capitalize">{{ credits.accountType || 'free' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Active Subscriptions</p>
          <p class="text-2xl font-bold mt-0.5">{{ activeSubscriptions.length }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Total Orders</p>
          <p class="text-2xl font-bold mt-0.5">{{ allOrders.length }}</p>
        </div>
      </div>

      <!-- Credit Usage Bar -->
      <div class="mt-5 pt-5 border-t border-white/10">
        <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Credit usage</span>
          <span>{{ credits.accountType === 'free' ? 'Free tier · 0 credits remaining' : 'Active subscription' }}</span>
        </div>
        <div class="w-full bg-white/10 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-500"
            :class="credits.currentCredit > 50 ? 'bg-emerald-500' : credits.currentCredit > 10 ? 'bg-amber-500' : 'bg-rose-500'"
            :style="{ width: `${Math.min(100, (credits.currentCredit / 100) * 100)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-2 text-sm text-gray-400">Loading subscription data...</span>
    </div>

    <template v-else>
      <!-- Subscription History -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-900">Subscription History</h3>
          <router-link to="/user/packages" class="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1">
            Browse packages
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>

        <div v-if="subscriptions.length === 0" class="flex flex-col items-center justify-center py-16">
          <CreditCardIcon class="w-12 h-12 text-gray-200 mb-3" />
          <p class="text-sm font-medium text-gray-900">No subscriptions yet</p>
          <p class="text-xs text-gray-400 mt-1">Purchase a package to get started</p>
          <router-link to="/user/packages" class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">
            <ShoppingBagIcon class="w-4 h-4 mr-2" />
            View Packages
          </router-link>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div v-for="sub in subscriptions" :key="sub.id" class="px-5 py-4 hover:bg-gray-50/50 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="sub.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'"
                >
                  <CreditCardIcon class="w-5 h-5" :class="sub.status === 'active' ? 'text-emerald-700' : 'text-gray-400'" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ sub.packageName || sub.package?.name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ sub.creditGranted }} credits · {{ sub.package?.durationDays || '—' }} days
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xs text-gray-400">Expires</p>
                  <p class="text-sm font-medium text-gray-900">{{ formatDate(sub.expiresAt) }}</p>
                </div>
                <span :class="getSubscriptionStatusBadge(sub.status)">{{ sub.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Orders History -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-900">Orders History</h3>
          <router-link to="/user/orders" class="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1">
            View all
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>

        <div v-if="allOrders.length === 0" class="flex flex-col items-center justify-center py-16">
          <DocumentIcon class="w-12 h-12 text-gray-200 mb-3" />
          <p class="text-sm font-medium text-gray-900">No orders yet</p>
          <p class="text-xs text-gray-400 mt-1">Your purchase history will appear here</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-50">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="order in allOrders" :key="order.id" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <DocumentIcon class="w-4 h-4 text-gray-400" />
                    </div>
                    <p class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <p class="text-sm text-gray-700">{{ order.package?.name || order.packageName || '—' }}</p>
                </td>
                <td class="px-5 py-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">{{ order.packageType || '—' }}</span>
                </td>
                <td class="px-5 py-4">
                  <p class="text-sm font-medium text-gray-900">{{ formatCurrency(order.priceAmount || order.amount, order.currency) }}</p>
                </td>
                <td class="px-5 py-4">
                  <p class="text-sm text-gray-500">{{ formatDate(order.createdAt) }}</p>
                </td>
                <td class="px-5 py-4">
                  <span :class="getOrderStatusBadge(order.status)">{{ order.status }}</span>
                </td>
                <td class="px-5 py-4 text-right">
                  <router-link :to="`/user/orders/${order.id}`" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    View
                    <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CreditCardIcon, PlusIcon, ShoppingBagIcon, DocumentIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'

const credits = ref({ currentCredit: 0, accountType: 'free' })
const subscriptions = ref([])
const allOrders = ref([])
const loading = ref(true)

const activeSubscriptions = computed(() =>
  subscriptions.value.filter(s => s.status === 'active')
)

onMounted(async () => {
  try {
    const [creditsData, subscriptionsData, ordersData] = await Promise.all([
      userService.getCredits(),
      userService.getSubscription(),
      userService.getOrders()
    ])
    credits.value = creditsData
    subscriptions.value = subscriptionsData
    allOrders.value = ordersData
  } catch (error) {
    console.error('Failed to load subscription data:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatCurrency = (amount, currency) => {
  if (!amount && amount !== 0) return '—'
  const num = Number(amount)
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(num)
}

const getSubscriptionStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusMap = {
    active: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-rose-50 text-rose-700',
    completed: 'bg-violet-50 text-violet-700'
  }
  return `${base} ${statusMap[status] || 'bg-gray-50 text-gray-600'}`
}

const getOrderStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusMap = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
    completed: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-gray-100 text-gray-500'
  }
  return `${base} ${statusMap[status] || 'bg-gray-50 text-gray-600'}`
}
</script>
