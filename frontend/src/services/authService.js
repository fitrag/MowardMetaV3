import api from './api'

export const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password })
    return response.data
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = response.data.data
    
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    
    return response.data
  },

  async loginWithGoogle(idToken) {
    const response = await api.post('/auth/google', { idToken })
    const { accessToken, refreshToken, user } = response.data.data
    
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    
    return response.data
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await api.post('/auth/logout', { refreshToken })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    const user = response.data.data
    localStorage.setItem('user', JSON.stringify(user))
    return user
  },

  async changePassword(oldPassword, newPassword) {
    const response = await api.patch('/auth/change-password', { 
      currentPassword: oldPassword, 
      newPassword 
    })
    return response.data
  },

  getCurrentUserFromStorage() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken')
  }
}
