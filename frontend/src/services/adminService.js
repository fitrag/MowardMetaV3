import api from './api'

export const adminService = {
  // Users Management
  async getUsers() {
    const response = await api.get('/admin/users')
    return response.data.data
  },

  async getUser(id) {
    const response = await api.get(`/admin/users/${id}`)
    return response.data.data
  },

  async createUser(data) {
    const response = await api.post('/admin/users', data)
    return response.data.data
  },

  async updateUser(id, data) {
    const response = await api.patch(`/admin/users/${id}`, data)
    return response.data.data
  },

  async updateUserStatus(id, status) {
    const response = await api.patch(`/admin/users/${id}/status`, { status })
    return response.data.data
  },

  async resetUserPassword(id, newPassword) {
    const response = await api.patch(`/admin/users/${id}/reset-password`, { newPassword })
    return response.data.data
  },

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data.data
  },

  // Providers Management
  async getProviders() {
    const response = await api.get('/admin/providers')
    return response.data.data
  },

  async getProvider(id) {
    const response = await api.get(`/admin/providers/${id}`)
    return response.data.data
  },

  async createProvider(data) {
    const response = await api.post('/admin/providers', data)
    return response.data.data
  },

  async updateProvider(id, data) {
    const response = await api.patch(`/admin/providers/${id}`, data)
    return response.data.data
  },

  async deleteProvider(id) {
    const response = await api.delete(`/admin/providers/${id}`)
    return response.data.data
  },

  // Provider Models
  async getProviderModels(providerId) {
    const response = await api.get(`/admin/providers/${providerId}/models`)
    return response.data.data
  },

  async createProviderModel(providerId, data) {
    const response = await api.post(`/admin/providers/${providerId}/models`, data)
    return response.data.data
  },

  async updateProviderModel(id, data) {
    const response = await api.patch(`/admin/provider-models/${id}`, data)
    return response.data.data
  },

  async deleteProviderModel(id) {
    const response = await api.delete(`/admin/provider-models/${id}`)
    return response.data.data
  },

  async fetchProviderModels(providerId) {
    const response = await api.post(`/admin/providers/${providerId}/models/fetch`)
    return response.data.data
  },

  async getProviderModels(providerId) {
    const response = await api.get(`/admin/providers/${providerId}/models`)
    return response.data.data
  },

  async createProviderModel(providerId, data) {
    const response = await api.post(`/admin/providers/${providerId}/models`, data)
    return response.data.data
  },

  async updateProviderModel(id, data) {
    const response = await api.patch(`/admin/provider-models/${id}`, data)
    return response.data.data
  },

  async deleteProviderModel(id) {
    const response = await api.delete(`/admin/provider-models/${id}`)
    return response.data.data
  },

  // API Keys
  async getApiKeys() {
    const response = await api.get('/admin/api-keys')
    return response.data.data
  },

  async getApiKey(id) {
    const response = await api.get(`/admin/api-keys/${id}`)
    return response.data.data
  },

  async createApiKey(data) {
    const response = await api.post('/admin/api-keys', data)
    return response.data.data
  },

  async updateApiKey(id, data) {
    const response = await api.patch(`/admin/api-keys/${id}`, data)
    return response.data.data
  },

  async deleteApiKey(id) {
    const response = await api.delete(`/admin/api-keys/${id}`)
    return response.data.data
  },

  async rollApiKey(id) {
    const response = await api.post(`/admin/api-keys/${id}/roll`)
    return response.data.data
  },

  async resetApiKeyHealth(id) {
    const response = await api.post(`/admin/api-keys/${id}/reset-health`)
    return response.data.data
  },

  // Packages
  async getPackages() {
    const response = await api.get('/admin/packages')
    return response.data.data
  },

  async getPackage(id) {
    const response = await api.get(`/admin/packages/${id}`)
    return response.data.data
  },

  async createPackage(data) {
    const response = await api.post('/admin/packages', data)
    return response.data.data
  },

  async updatePackage(id, data) {
    const response = await api.patch(`/admin/packages/${id}`, data)
    return response.data.data
  },

  async deletePackage(id) {
    const response = await api.delete(`/admin/packages/${id}`)
    return response.data.data
  },

  // Subscriptions
  async getSubscriptions() {
    const response = await api.get('/admin/subscriptions')
    return response.data.data
  },

  async getSubscription(id) {
    const response = await api.get(`/admin/subscriptions/${id}`)
    return response.data.data
  },

  // Payment Methods
  async getPaymentMethods() {
    const response = await api.get('/admin/payment-methods')
    return response.data.data
  },

  async createPaymentMethod(data) {
    const response = await api.post('/admin/payment-methods', data)
    return response.data.data
  },

  async updatePaymentMethod(id, data) {
    const response = await api.patch(`/admin/payment-methods/${id}`, data)
    return response.data.data
  },

  async deletePaymentMethod(id) {
    const response = await api.delete(`/admin/payment-methods/${id}`)
    return response.data.data
  },

  // Orders
  async getOrders() {
    const response = await api.get('/admin/orders')
    return response.data.data
  },

  async getOrder(id) {
    const response = await api.get(`/admin/orders/${id}`)
    return response.data.data
  },

  async approveOrder(id) {
    const response = await api.patch(`/admin/orders/${id}/approve`)
    return response.data.data
  },

  async rejectOrder(id, rejectionReason) {
    const response = await api.patch(`/admin/orders/${id}/reject`, { rejectionReason })
    return response.data.data
  },

  // Settings
  async getSettings() {
    const response = await api.get('/admin/settings')
    return response.data.data
  },

  async getSetting(key) {
    const response = await api.get(`/admin/settings/${key}`)
    return response.data.data
  },

  async updateSetting(key, value) {
    const response = await api.patch(`/admin/settings/${key}`, { value })
    return response.data.data
  },

  async bulkUpdateSettings(items) {
    const response = await api.put('/admin/settings/bulk', { items })
    return response.data.data
  },

  async getSettingsHistory() {
    const response = await api.get('/admin/settings/history')
    return response.data.data
  }
}
