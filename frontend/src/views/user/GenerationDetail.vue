<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-2 text-sm text-gray-400">Loading generation details...</span>
    </div>

    <!-- Not Found -->
    <div v-else-if="!generation" class="flex flex-col items-center justify-center py-20">
      <PhotoIcon class="w-12 h-12 text-gray-200 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">Generation not found</h3>
      <router-link to="/user/generations" class="text-sm text-violet-600 hover:text-violet-700 transition-colors duration-150 mt-2">
        &larr; Back to Generations
      </router-link>
    </div>

    <template v-else>
      <!-- Dark Header -->
      <div class="bg-gray-950 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link to="/user/generations" class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <div>
              <h2 class="text-base font-semibold">{{ generation.inputFilename || 'Unknown File' }}</h2>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(generation.createdAt) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative">
              <button @click="showExportMenu = !showExportMenu" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ArrowDownTrayIcon class="w-3.5 h-3.5 mr-1.5" />
                Export
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
            <button @click="copyAllMetadata" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ClipboardIcon class="w-3.5 h-3.5 mr-1.5" />
              Copy All
            </button>
            <span :class="getStatusBadge(generation.status)">{{ generation.status }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/10">
          <div>
            <p class="text-xs text-gray-500">Provider</p>
            <p class="text-sm font-medium mt-0.5">{{ generation.providerName || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Model</p>
            <p class="text-sm font-medium mt-0.5">{{ generation.modelName || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Key Source</p>
            <p class="text-sm font-medium mt-0.5 capitalize">{{ generation.keySource || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Credits Used</p>
            <p class="text-sm font-medium mt-0.5">{{ generation.creditUsed || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Success Result -->
      <div v-if="generation.status === 'success' && generation.title" class="space-y-6">
        <!-- Title, Description & SEO Score -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Title & Description -->
          <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">Title</label>
                <button @click="copyToClipboard(generation.title)" class="text-gray-300 hover:text-gray-900 transition-colors p-1" title="Copy">
                  <ClipboardIcon class="w-4 h-4" />
                </button>
              </div>
              <p class="text-lg font-semibold text-gray-900 leading-snug">{{ generation.title }}</p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</label>
                <button @click="copyToClipboard(generation.description)" class="text-gray-300 hover:text-gray-900 transition-colors p-1" title="Copy">
                  <ClipboardIcon class="w-4 h-4" />
                </button>
              </div>
              <p class="text-sm text-gray-700 leading-relaxed">{{ generation.description }}</p>
            </div>
          </div>

          <!-- SEO Score -->
          <div class="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center justify-center">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">SEO Score</label>
            <div class="relative w-28 h-28">
              <svg class="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" stroke-width="2" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-dasharray="100" :stroke-dashoffset="100 - seoScore"
                  stroke-linecap="round" :class="getSeoScoreColorClass(seoScore)" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-gray-900">{{ seoScore }}</span>
                <span class="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
            <div class="w-full mt-4 space-y-2">
              <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span class="text-xs text-gray-400">Keywords</span>
                <span class="text-sm font-semibold text-gray-900">{{ generation.keywords?.length || 0 }}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span class="text-xs text-gray-400">Title Length</span>
                <span class="text-sm font-semibold text-gray-900">{{ generation.title?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Keywords -->
        <div class="bg-white rounded-xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-gray-900">
              Keywords
              <span class="text-xs font-normal text-gray-400 ml-2">({{ generation.keywords?.length || 0 }})</span>
            </h3>
            <button @click="copyKeywords" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              <ClipboardIcon class="w-3.5 h-3.5 mr-1.5" />
              Copy All
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="keyword in generation.keywords"
              :key="keyword"
              class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-pointer transition-colors"
              @click="copyToClipboard(keyword)"
              title="Click to copy"
            >
              {{ keyword }}
            </span>
          </div>
        </div>

        <!-- Categories, Image Details, Colors -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Categories -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="cat in generation.categories" :key="cat" class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                {{ cat }}
              </span>
              <span v-if="!generation.categories?.length" class="text-xs text-gray-400">—</span>
            </div>
          </div>

          <!-- Image Details -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Image Details</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">Orientation</span>
                <span class="text-sm font-medium text-gray-900 capitalize">{{ generation.orientation || '—' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">Type</span>
                <span class="text-sm font-medium text-gray-900 capitalize">{{ generation.imageType || '—' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">People</span>
                <span class="text-sm font-medium text-gray-900">{{ generation.peopleCount ?? '—' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">Commercial</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                  :class="{
                    'bg-emerald-50 text-emerald-700': generation.commercialViability === 'high',
                    'bg-amber-50 text-amber-700': generation.commercialViability === 'medium',
                    'bg-rose-50 text-rose-700': generation.commercialViability === 'low' || generation.commercialViability === 'editorial',
                    'bg-gray-50 text-gray-500': !['high','medium','low','editorial'].includes(generation.commercialViability)
                  }"
                >{{ generation.commercialViability || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Dominant Colors -->
          <div class="bg-white rounded-xl border border-gray-100 p-6">
            <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Dominant Colors</h3>
            <div v-if="generation.dominantColors?.length" class="flex flex-wrap gap-3">
              <div v-for="color in generation.dominantColors" :key="color" class="group relative">
                <div class="w-12 h-12 rounded-xl border border-gray-200 shadow-sm transition-transform hover:scale-110" :style="{ backgroundColor: color }"></div>
                <div class="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100 whitespace-nowrap">{{ color }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">—</p>
          </div>
        </div>
      </div>

      <!-- Failed Result -->
      <div v-if="generation.status === 'failed'" class="bg-white rounded-xl border border-rose-100 p-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">Generation Failed</h3>
            <p class="text-sm text-gray-500 mt-1">{{ generation.errorMessage || 'Unknown error occurred' }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Toast -->
    <transition name="slide-up">
      <div v-if="copied" class="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50">
        <CheckCircleIcon class="w-5 h-5 text-emerald-400 mr-2" />
        <span class="text-sm">Copied to clipboard!</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { PhotoIcon, ClipboardIcon, CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'
import { getPlatforms, exportGenerations } from '../../services/exportService'

const route = useRoute()
const generation = ref(null)
const loading = ref(true)
const copied = ref(false)
const showExportMenu = ref(false)
const platforms = getPlatforms()

const handleExport = (platformId, format) => {
  if (!generation.value) return
  exportGenerations([generation.value], platformId, format)
  showExportMenu.value = false
}

onMounted(async () => {
  try {
    generation.value = await userService.getGeneration(route.params.id)
  } catch (error) {
    console.error('Failed to load generation detail:', error)
  } finally {
    loading.value = false
  }
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
    success: 'bg-emerald-500/20 text-emerald-300',
    failed: 'bg-rose-500/20 text-rose-300',
    pending: 'bg-amber-500/20 text-amber-300'
  }
  return `${base} ${statusMap[status] || 'bg-white/10 text-gray-400'}`
}

const copyToClipboard = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const copyKeywords = async () => {
  if (!generation.value?.keywords) return
  const keywordsText = generation.value.keywords.join(', ')
  await copyToClipboard(keywordsText)
}

const copyAllMetadata = async () => {
  if (!generation.value) return
  const text = [
    `Title: ${generation.value.title}`,
    `Description: ${generation.value.description}`,
    `Categories: ${(generation.value.categories || []).join(', ')}`,
    `Keywords: ${(generation.value.keywords || []).join(', ')}`,
  ].join('\n\n')
  await copyToClipboard(text)
}

const seoScore = computed(() => {
  if (!generation.value) return 0
  const keywordCount = generation.value.keywords?.length || 0
  const titleLength = generation.value.title?.length || 0
  let score = 0
  score += Math.min(70, keywordCount * 1.5)
  score += Math.min(30, titleLength * 0.5)
  return Math.min(100, Math.floor(score))
})

const getSeoScoreColorClass = (score) => {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-violet-500'
  if (score >= 40) return 'text-amber-500'
  return 'text-rose-500'
}
</script>
