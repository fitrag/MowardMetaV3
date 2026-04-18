<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <h2 class="text-lg font-medium">Admin Dashboard</h2>
      <p class="text-sm text-gray-400 mt-1">Manage your ShowModel application</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Users</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.userCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <UsersIcon class="w-5 h-5 text-white" />
          </div>
        </div>
        <router-link to="/admin/users" class="mt-3 inline-flex items-center text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
          View all
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </router-link>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Providers</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.providerCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CpuChipIcon class="w-5 h-5 text-emerald-700" />
          </div>
        </div>
        <router-link to="/admin/providers" class="mt-3 inline-flex items-center text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
          View all
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </router-link>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Orders</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.orderCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <DocumentIcon class="w-5 h-5 text-amber-700" />
          </div>
        </div>
        <p class="text-xs text-amber-600 mt-3">{{ stats.pendingOrders }} pending approval</p>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Generations</p>
            <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ stats.generationCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <PhotoIcon class="w-5 h-5 text-violet-700" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl border border-gray-100 p-6">
      <h3 class="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <router-link to="/admin/users" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <UsersIcon class="w-4 h-4 mr-2" />
          Manage Users
        </router-link>
        <router-link to="/admin/providers" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <CpuChipIcon class="w-4 h-4 mr-2" />
          AI Providers
        </router-link>
        <router-link to="/admin/packages" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <ShoppingBagIcon class="w-4 h-4 mr-2" />
          Packages
        </router-link>
        <router-link to="/admin/orders" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <DocumentIcon class="w-4 h-4 mr-2" />
          Orders
        </router-link>
        <router-link to="/admin/payment-methods" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <CreditCardIcon class="w-4 h-4 mr-2" />
          Payment Methods
        </router-link>
        <router-link to="/admin/coupons" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <TicketIcon class="w-4 h-4 mr-2" />
          Coupons
        </router-link>
        <router-link to="/admin/api-keys" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <KeyIcon class="w-4 h-4 mr-2" />
          API Keys
        </router-link>
        <router-link to="/admin/settings" class="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Cog6ToothIcon class="w-4 h-4 mr-2" />
          Settings
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UsersIcon, CpuChipIcon, DocumentIcon, ShoppingBagIcon, CreditCardIcon, KeyIcon, Cog6ToothIcon, PhotoIcon, TicketIcon } from '@heroicons/vue/24/outline'
import api from '../../services/api'

const stats = ref({ userCount: 0, providerCount: 0, orderCount: 0, pendingOrders: 0, generationCount: 0 })

onMounted(async () => {
  try {
    const res = await api.get('/admin/dashboard-summary')
    stats.value = res.data.data
  } catch (e) {
    console.error('Failed to load dashboard stats:', e)
  }
})
</script>
