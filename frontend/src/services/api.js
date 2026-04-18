import axios from 'axios'

// Helper function to convert snake_case to camelCase
function snakeToCamel(str) {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase())
}

// Recursively convert object keys from snake_case to camelCase
function convertKeysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase)
  } else if (obj !== null && obj !== undefined && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key)
      result[camelKey] = convertKeysToCamelCase(obj[key])
      return result
    }, {})
  }
  return obj
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3005/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - convert snake_case to camelCase AND handle token refresh
api.interceptors.response.use(
  (response) => {
    // Convert response data keys from snake_case to camelCase
    if (response.data && typeof response.data === 'object') {
      response.data = convertKeysToCamelCase(response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/auth/refresh`,
          { refreshToken }
        )

        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
