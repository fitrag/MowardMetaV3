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

      <div v-else-if="generations.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
        <PhotoIcon class="w-10 h-10 mb-2" />
        <p class="text-sm">No generations found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="gen in generations" :key="gen.id" class="hover:bg-gray-50/50 transition-colors duration-150">
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ gen.inputFilename }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ gen.user?.name }}</div>
                <div class="text-xs text-gray-500">{{ gen.user?.email }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="gen.status === 'success' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700' : gen.status === 'pending' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700'">{{ gen.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ gen.creditUsed || 0 }}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatDate(gen.createdAt) }}</div>
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
import { PhotoIcon } from '@heroicons/vue/24/outline'
import { operatorService } from '../../services/publicService'

const generations = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    generations.value = await operatorService.getGenerations()
  } catch (error) {
    console.error('Failed to load generations:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>
