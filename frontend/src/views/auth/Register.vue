<template>
  <div class="min-h-screen flex bg-white">
    <!-- Left Side - Dark Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col items-center justify-center p-12 relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <div class="relative z-10 max-w-md text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-4">{{ siteName }}</h1>
        <p class="text-gray-400 text-lg leading-relaxed mb-8">
          {{ siteDescription || 'Generate professional Adobe Stock metadata from your images using AI. Save time and boost your sales.' }}
        </p>
        <div class="space-y-4 text-left">
          <div class="flex items-center gap-3 text-gray-300">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-sm">AI-powered title, description & keywords</span>
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-sm">SEO-optimized for Adobe Stock</span>
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-sm">Batch processing with export</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Form -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-xl font-semibold text-gray-900">{{ siteName }}</h1>
        </div>

        <!-- Header -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Create your account</h2>
          <p class="text-sm text-gray-500 mt-1">Start generating metadata for your images</p>
        </div>

        <!-- Error / Success -->
        <div v-if="error" class="mb-6 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>
        <div v-if="success" class="mb-6 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          {{ success }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
              placeholder="John Doe"
              autocomplete="name"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
              placeholder="At least 6 characters"
              autocomplete="new-password"
            />
            <p class="mt-1.5 text-xs text-gray-400">Must be at least 6 characters long</p>
          </div>

          <!-- Submit -->
          <button type="submit" class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="loading">
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="mt-6 flex items-center gap-3">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400">or</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- Google Sign-Up -->
        <button
          @click="handleGoogleLogin"
          class="mt-4 w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <!-- Login Link -->
        <p class="mt-8 text-center text-sm text-gray-500">
          Already have an account?
          <router-link to="/login" class="ml-1 font-medium text-gray-900 hover:text-gray-700 transition-colors">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService'
import { useSiteConfig } from '../../composables/useSiteConfig'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const { siteName, siteDescription, loadSettings } = useSiteConfig()

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await authService.register(name.value, email.value, password.value)
    success.value = 'Account created successfully! Redirecting to login...'
    setTimeout(() => router.push('/login'), 1500)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create account.'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = () => {
  if (!window.google) {
    error.value = 'Google Sign-In is not configured. Please use email/password.'
    return
  }
  loading.value = true
  error.value = ''

  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
    auto_select: false,
  })

  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      window.google.accounts.id.loginWithPopup(
        { client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID },
        handleGoogleResponse
      )
    }
  })
}

const handleGoogleResponse = async (response) => {
  try {
    const idToken = response.credential || response.id_token
    if (!idToken) {
      error.value = 'Google Sign-In failed: No token received'
      loading.value = false
      return
    }
    await authService.loginWithGoogle(idToken)
    const user = authService.getCurrentUserFromStorage()
    if (user.role === 'admin') router.push('/admin')
    else if (user.role === 'operator') router.push('/operator')
    else router.push('/user')
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Google Sign-In failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }
})
</script>
