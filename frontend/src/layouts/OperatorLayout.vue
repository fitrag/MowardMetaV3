<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Sidebar -->
    <aside
      class="fixed top-0 left-0 h-screen bg-gray-950 flex flex-col z-30 transition-all duration-300 ease-in-out"
      :class="sidebarOpen ? 'w-64' : 'w-16'"
    >
      <!-- Logo -->
      <div class="border-b border-white/10 flex items-center" :class="sidebarOpen ? 'px-6 py-5' : 'px-4 py-5 justify-center'">
        <div v-if="sidebarOpen">
          <h1 class="text-sm font-semibold text-white tracking-tight">{{ siteName }}</h1>
          <p class="text-xs text-gray-500 mt-0.5">Operator Panel</p>
        </div>
        <h1 v-else class="text-sm font-semibold text-white">{{ siteName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}</h1>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center rounded-lg transition-colors duration-150 overflow-hidden"
          :class="[
            sidebarOpen ? 'px-3 py-2 gap-3' : 'px-0 py-2.5 justify-center',
            isActive(item.to)
              ? 'bg-white text-gray-950 font-medium'
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="truncate transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- User Section -->
      <div class="px-3 py-4 border-t border-white/10">
        <div class="flex items-center rounded-lg overflow-hidden" :class="sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center py-2'">
          <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs font-medium">{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0 transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'">
            <p class="text-xs font-medium text-white truncate">{{ user?.name }}</p>
            <p class="text-xs text-gray-500 truncate">Operator</p>
          </div>
          <button @click="handleLogout" class="text-gray-500 hover:text-white transition-colors flex-shrink-0" title="Logout" v-if="sidebarOpen">
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex flex-col min-h-screen transition-all duration-300 ease-in-out" :class="sidebarOpen ? 'ml-64' : 'ml-16'">
      <!-- Top Bar -->
      <header class="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button @click="sidebarOpen = !sidebarOpen" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <Bars3Icon class="w-5 h-5" />
        </button>
        <h2 class="text-base font-semibold text-gray-900">{{ currentTitle }}</h2>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  DocumentIcon,
  UsersIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon
} from '@heroicons/vue/24/outline'
import { authService } from '@/services/authService'
import { useSiteConfig } from '@/composables/useSiteConfig'

const route = useRoute()
const router = useRouter()
const user = computed(() => authService.getCurrentUserFromStorage())
const sidebarOpen = ref(localStorage.getItem('sidebarOpen') !== 'false')
const { siteName, loadSettings } = useSiteConfig()

onMounted(() => {
  loadSettings()
})

watch(sidebarOpen, (value) => {
  localStorage.setItem('sidebarOpen', value)
})

const userInitials = computed(() => {
  if (!user.value?.name) return 'O'
  return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const navigation = [
  { to: '/operator', label: 'Dashboard', icon: HomeIcon },
  { to: '/operator/orders', label: 'Orders', icon: DocumentIcon },
  { to: '/operator/users', label: 'Users', icon: UsersIcon },
  { to: '/operator/generations', label: 'Generations', icon: PhotoIcon }
]

const isActive = (path) => {
  if (path === '/operator') return route.path === '/operator'
  return route.path === path || route.path.startsWith(path + '/')
}

const currentTitle = computed(() => {
  let bestMatch = null
  let bestLength = 0

  for (const item of navigation) {
    if (isActive(item.to) && item.to.length > bestLength) {
      bestMatch = item
      bestLength = item.to.length
    }
  }

  if (bestMatch) return bestMatch.label
  return 'Dashboard'
})

const handleLogout = async () => {
  await authService.logout()
  router.push('/login')
}
</script>
