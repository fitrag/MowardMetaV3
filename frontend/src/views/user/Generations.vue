<template>
  <div class="space-y-6">
    <!-- Stats Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <PhotoIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-xs text-gray-400">Total Generations</p>
            <p class="text-xl font-semibold text-gray-900">{{ pagination.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon class="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p class="text-xs text-gray-400">Success Rate</p>
            <p class="text-xl font-semibold text-gray-900">{{ successRate }}%</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <CreditCardIcon class="w-5 h-5 text-violet-700" />
          </div>
          <div>
            <p class="text-xs text-gray-400">Credits Used</p>
            <p class="text-xl font-semibold text-gray-900">{{ totalCredits }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3">
      <div class="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
        <svg class="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="search" @input="onSearchDebounced" type="text" placeholder="Search files..." class="text-sm outline-none w-full bg-transparent placeholder-gray-400" />
      </div>

      <div class="inline-flex bg-white border border-gray-200 rounded-lg p-0.5">
        <button @click="setFilter('all')" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'">
          All
        </button>
        <button @click="setFilter('success')" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'success' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-900'">
          Success
        </button>
        <button @click="setFilter('failed')" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'failed' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-900'">
          Failed
        </button>
        <button @click="setFilter('pending')" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" :class="filter === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-900'">
          Pending
        </button>
      </div>

      <!-- Export Dropdown -->
      <div class="relative ml-auto">
        <button
          @click="showExportMenu = !showExportMenu"
          :disabled="selectedIds.size === 0"
          class="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon class="w-3.5 h-3.5 mr-1.5" />
          Export ({{ selectedIds.size }})
        </button>
        <div v-if="showExportMenu" class="absolute right-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-40 py-1.5" @mouseleave="showExportMenu = false">
          <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Export to Platform</div>
          <div v-for="p in platforms" :key="p.id" class="px-1">
            <div class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer" @click="handleExport(p.id, 'csv')">
              <span class="text-xs text-gray-700">{{ p.name }}</span>
              <span class="text-xs text-gray-400">CSV</span>
            </div>
            <div class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer" @click="handleExport(p.id, 'xlsx')">
              <span class="text-xs text-gray-700">{{ p.name }}</span>
              <span class="text-xs text-gray-400">Excel</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div v-if="loading && generations.length === 0" class="flex items-center justify-center py-16">
        <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-sm text-gray-400">Loading generations...</span>
      </div>

      <div v-else-if="generations.length === 0" class="flex flex-col items-center justify-center py-16 px-5">
        <PhotoIcon class="w-12 h-12 text-gray-200 mb-3" />
        <h3 class="text-sm font-medium text-gray-900 mb-1">
          {{ search || filter !== 'all' ? 'No matching generations' : 'No generations yet' }}
        </h3>
        <p class="text-xs text-gray-400 mb-4">
          {{ search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Upload an image to generate your first metadata' }}
        </p>
        <router-link v-if="!search && filter === 'all'" to="/user/generate" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150">
          <SparklesIcon class="w-4 h-4 mr-2" />
          Generate Metadata
        </router-link>
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-50">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="px-5 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    :checked="selectedIds.size > 0 && selectedIds.size === visibleSuccessCount"
                    :indeterminate.prop="selectedIds.size > 0 && selectedIds.size < visibleSuccessCount"
                    @change="toggleSelectAll"
                    class="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="gen in generations" :key="gen.id" class="hover:bg-gray-50/50 transition-colors duration-50" :class="{ 'bg-gray-50/30': selectedIds.has(gen.id) }">
                <td class="px-5 py-4">
                  <input
                    v-if="gen.status === 'success' && gen.title"
                    type="checkbox"
                    :checked="selectedIds.has(gen.id)"
                    @change="toggleSelect(gen.id)"
                    class="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <PhotoIcon class="w-4 h-4 text-gray-400" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ gen.inputFilename || 'Unknown' }}</p>
                      <p v-if="gen.title" class="text-xs text-gray-400 truncate max-w-xs mt-0.5">{{ gen.title }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-700">{{ gen.providerName || '—' }}</div>
                  <div v-if="gen.modelName" class="text-xs text-gray-400 mt-0.5">{{ gen.modelName }}</div>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <span :class="getStatusBadge(gen.status)">{{ gen.status }}</span>
                  <div v-if="gen.status === 'failed'" class="text-xs text-gray-400 mt-1 truncate max-w-[150px]" :title="gen.errorMessage">
                    {{ gen.errorMessage?.substring(0, 30) }}...
                  </div>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ gen.creditUsed || 0 }}</div>
                </td>
                <td class="px-5 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ formatDate(gen.createdAt) }}</div>
                </td>
                <td class="px-5 py-4 whitespace-nowrap text-right">
                  <router-link :to="`/user/generations/${gen.id}`" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-150">
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

        <!-- Loading More / End of List -->
        <div ref="sentinelRef" class="py-4">
          <div v-if="loadingMore" class="flex items-center justify-center py-4">
            <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2 text-sm text-gray-400">Loading more...</span>
          </div>
          <div v-else-if="!hasMore && generations.length > 0" class="text-center py-3">
            <p class="text-xs text-gray-400">All generations loaded ({{ generations.length }} of {{ pagination.total }})</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PhotoIcon, SparklesIcon, CheckCircleIcon, CreditCardIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'
import { getPlatforms, exportGenerations } from '../../services/exportService'

const generations = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const search = ref('')
const filter = ref('all')
const selectedIds = ref(new Set())
const showExportMenu = ref(false)
const platforms = getPlatforms()
const sentinelRef = ref(null)

const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

let searchTimeout = null
let observer = null

const fetchGenerations = async (append = false) => {
  if (!append) loading.value = true
  else loadingMore.value = true

  try {
    const page = append ? pagination.value.page + 1 : 1
    const statusFilter = filter.value !== 'all' ? filter.value : ''
    const res = await userService.getGenerations(page, 20, statusFilter, search.value)
    const data = res.data || []
    const pg = res.pagination || { page, limit: 20, total: data.length, totalPages: 1 }

    if (append) {
      generations.value = [...generations.value, ...data]
    } else {
      generations.value = data
      selectedIds.value = new Set()
    }
    pagination.value = pg
  } catch (error) {
    console.error('Failed to load generations:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    setTimeout(watchSentinel, 100)
  }
}

const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    fetchGenerations(true)
  }
}

const setFilter = (val) => {
  filter.value = val
  fetchGenerations()
}

const onSearchDebounced = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchGenerations(), 400)
}

onMounted(async () => {
  await fetchGenerations()

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadMore()
    },
    { rootMargin: '200px' }
  )

  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  clearTimeout(searchTimeout)
})

const watchSentinel = () => {
  if (observer && sentinelRef.value) {
    observer.disconnect()
    observer.observe(sentinelRef.value)
  }
}

const visibleSuccessCount = computed(() => {
  return generations.value.filter(g => g.status === 'success' && g.title).length
})

const successRate = computed(() => {
  if (generations.value.length === 0) return 0
  const success = generations.value.filter(g => g.status === 'success').length
  return Math.round((success / generations.value.length) * 100)
})

const totalCredits = computed(() => {
  return generations.value.reduce((sum, g) => sum + (g.creditUsed || 0), 0)
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusBadge = (status) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusMap = {
    success: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
    pending: 'bg-amber-50 text-amber-700'
  }
  return `${base} ${statusMap[status] || 'bg-gray-50 text-gray-600'}`
}

const toggleSelectAll = () => {
  const successItems = generations.value.filter(g => g.status === 'success' && g.title)
  if (selectedIds.value.size === successItems.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(successItems.map(g => g.id))
  }
}

const toggleSelect = (id) => {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

const handleExport = (platformId, format) => {
  const selected = generations.value.filter(g => selectedIds.value.has(g.id))
  if (selected.length === 0) return
  exportGenerations(selected, platformId, format)
  showExportMenu.value = false
}
</script>
