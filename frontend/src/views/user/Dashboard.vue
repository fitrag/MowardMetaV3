<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Welcome back, {{ user?.name }}</h2>
          <p class="text-sm text-gray-400 mt-1">Generate Adobe Stock metadata powered by AI</p>
        </div>
        <router-link to="/user/generate" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-150">
          <SparklesIcon class="w-4 h-4 mr-2" />
          New Generation
        </router-link>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Total Generations</p>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ overview.totalGenerations }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <PhotoIcon class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Success Rate</p>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ overview.successRate }}<span class="text-sm font-normal text-gray-400">%</span></p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon class="w-5 h-5 text-emerald-700" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Credits Used</p>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ overview.totalCreditsUsed }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <CreditCardIcon class="w-5 h-5 text-violet-700" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400">Credits Remaining</p>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ credits }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <BoltIcon class="w-5 h-5 text-amber-700" />
          </div>
        </div>
        <router-link to="/user/topup" class="mt-2 inline-flex items-center text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">
          Top up credits
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </router-link>
      </div>
    </div>

    <!-- Period Selector -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-900">Analytics</h3>
      <div class="inline-flex bg-white border border-gray-200 rounded-lg p-0.5">
        <button v-for="p in periods" :key="p.value" @click="changePeriod(p.value)" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="period === p.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'">
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Generations Timeline -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Generations Timeline</h4>
        <div class="h-64">
          <Bar v-if="generationsChartData" :data="generationsChartData" :options="barOptions" />
          <div v-else class="flex items-center justify-center h-full text-sm text-gray-400">No data yet</div>
        </div>
      </div>

      <!-- Credit Usage -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Credits Used Per Day</h4>
        <div class="h-64">
          <Line v-if="creditsChartData" :data="creditsChartData" :options="lineOptions" />
          <div v-else class="flex items-center justify-center h-full text-sm text-gray-400">No data yet</div>
        </div>
      </div>

      <!-- Provider Breakdown -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Provider Usage</h4>
        <div class="h-64 flex items-center justify-center">
          <Doughnut v-if="providerChartData" :data="providerChartData" :options="doughnutOptions" />
          <div v-else class="text-sm text-gray-400">No data yet</div>
        </div>
      </div>

      <!-- Orders History -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Orders History</h4>
        <div class="h-64">
          <Bar v-if="ordersChartData" :data="ordersChartData" :options="ordersBarOptions" />
          <div v-else class="flex items-center justify-center h-full text-sm text-gray-400">No data yet</div>
        </div>
      </div>
    </div>

    <!-- Recent Generations -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-900">Recent Generations</h3>
          <router-link to="/user/generations" class="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
            View all
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-sm text-gray-400">Loading...</span>
      </div>

      <div v-else-if="recentGenerations.length === 0" class="flex flex-col items-center justify-center py-12 px-5">
        <PhotoIcon class="w-10 h-10 text-gray-200 mb-3" />
        <p class="text-sm text-gray-400">No generations yet. Upload your first image to get started!</p>
      </div>

      <div v-else class="divide-y divide-gray-50">
        <router-link
          v-for="gen in recentGenerations"
          :key="gen.id"
          :to="`/user/generations/${gen.id}`"
          class="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ gen.inputFilename }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(gen.createdAt) }}</p>
          </div>
          <span :class="getStatusBadge(gen.status)">{{ gen.status }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { PhotoIcon, CreditCardIcon, CheckCircleIcon, BoltIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { userService } from '../../services/userService'
import { authService } from '../../services/authService'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const user = computed(() => authService.getCurrentUserFromStorage())
const loading = ref(true)
const period = ref('30d')
const credits = ref(0)
const stats = ref(null)
const recentGenerations = ref([])

const periods = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
]

const overview = computed(() => stats.value?.overview || {
  totalGenerations: 0, totalSuccess: 0, totalFailed: 0, totalCreditsUsed: 0, successRate: 0
})

const fillDates = (data, key) => {
  if (!data || data.length === 0) return { labels: [], values: [] }
  const first = data[0].date
  const last = data[data.length - 1].date
  const start = new Date(first)
  const end = new Date(last)
  const labels = []
  const values = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    labels.push(iso.slice(5))
    const found = data.find(r => r.date === iso)
    values.push(found ? Number(found[key]) : 0)
  }
  return { labels, values }
}

const generationsChartData = computed(() => {
  const data = stats.value?.generationsByDay
  if (!data || data.length === 0) return null
  const success = fillDates(data, 'success')
  const failed = fillDates(data, 'failed')
  return {
    labels: success.labels,
    datasets: [
      {
        label: 'Success',
        data: success.values,
        backgroundColor: '#10b981',
        borderRadius: 3,
        barPercentage: 0.7,
      },
      {
        label: 'Failed',
        data: failed.values,
        backgroundColor: '#f43f5e',
        borderRadius: 3,
        barPercentage: 0.7,
      },
    ],
  }
})

const creditsChartData = computed(() => {
  const data = stats.value?.creditsUsedByDay
  if (!data || data.length === 0) return null
  const filled = fillDates(data, 'credits')
  return {
    labels: filled.labels,
    datasets: [{
      label: 'Credits',
      data: filled.values,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 4,
    }],
  }
})

const providerChartData = computed(() => {
  const data = stats.value?.providerBreakdown
  if (!data || data.length === 0) return null
  const colors = ['#111827', '#6b7280', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e']
  return {
    labels: data.map(d => d.provider),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: colors.slice(0, data.length),
      borderWidth: 0,
    }],
  }
})

const ordersChartData = computed(() => {
  const data = stats.value?.ordersByMonth
  if (!data || data.length === 0) return null
  return {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Orders',
      data: data.map(d => d.count),
      backgroundColor: '#f59e0b',
      borderRadius: 3,
      barPercentage: 0.6,
    }],
  }
})

const chartFont = { family: 'inherit', size: 11 }
const gridColor = 'rgba(0,0,0,0.04)'

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: true, position: 'top', labels: { font: chartFont, boxWidth: 10, padding: 12 } } },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: chartFont } },
    y: { stacked: true, beginAtZero: true, grid: { color: gridColor }, ticks: { font: chartFont } },
  },
}

const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: chartFont } },
    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: chartFont } },
  },
}

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { position: 'bottom', labels: { font: chartFont, padding: 16, boxWidth: 12 } } },
}

const ordersBarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: chartFont } },
    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: chartFont, stepSize: 1 } },
  },
}

const changePeriod = (val) => {
  period.value = val
  loadStats()
}

const loadStats = async () => {
  try {
    const [statsData, creditsData, generationsRes] = await Promise.all([
      userService.getUserStats(period.value),
      userService.getCredits(),
      userService.getGenerations(1, 5),
    ])
    stats.value = statsData
    credits.value = creditsData.currentCredit || 0
    recentGenerations.value = generationsRes.data || []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadStats())

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const getStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusMap = {
    success: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
    pending: 'bg-amber-50 text-amber-700'
  }
  return `${base} ${statusMap[status] || 'bg-gray-100 text-gray-600'}`
}
</script>
