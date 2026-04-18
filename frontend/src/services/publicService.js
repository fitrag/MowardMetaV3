import api from './api'

export const operatorService = {
  async getOrders() {
    const response = await api.get('/operator/orders')
    return response.data.data
  },

  async getOrder(id) {
    const response = await api.get(`/operator/orders/${id}`)
    return response.data.data
  },

  async approveOrder(id) {
    const response = await api.patch(`/operator/orders/${id}/approve`)
    return response.data.data
  },

  async rejectOrder(id, rejectionReason) {
    const response = await api.patch(`/operator/orders/${id}/reject`, { rejectionReason })
    return response.data.data
  },

  async getUsers() {
    const response = await api.get('/operator/users')
    return response.data.data
  },

  async getUser(id) {
    const response = await api.get(`/operator/users/${id}`)
    return response.data.data
  },

  async getGenerations() {
    const response = await api.get('/operator/generations')
    return response.data.data
  },

  async getDashboardSummary() {
    const response = await api.get('/operator/dashboard-summary')
    return response.data.data
  }
}

export const publicService = {
  async getPublicSettings() {
    const response = await api.get('/public/settings')
    return response.data.data
  },

  async getPublicProviders() {
    const response = await api.get('/public/providers')
    return response.data.data
  }
}
