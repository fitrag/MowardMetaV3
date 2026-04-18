import api from './api'

export const userService = {
  async getOrders() {
    const response = await api.get('/user/orders')
    return response.data.data
  },

  async getOrder(id) {
    const response = await api.get(`/user/orders/${id}`)
    return response.data.data
  },

  async createOrder(packageId, paymentMethodId, couponCode = null) {
    const response = await api.post('/user/orders', { packageId, paymentMethodId, couponCode })
    return response.data.data
  },

  async validateCoupon(code, packageId) {
    const response = await api.post('/user/coupons/validate', { code, packageId })
    return response.data.data
  },

  async uploadPaymentProof(orderId, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(`/user/orders/${orderId}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  },

  async getProviderModels(providerId) {
    const response = await api.get('/user/models', { params: { providerId } })
    return response.data.data
  },

  async getUserStats(period = '30d') {
    const response = await api.get('/user/stats', { params: { period } })
    return response.data.data
  },

  async getGenerations(page = 1, limit = 20, status = '', search = '') {
    const params = { page, limit }
    if (status) params.status = status
    if (search) params.search = search
    const response = await api.get('/user/generations', { params })
    return response.data
  },

  async getGeneration(id) {
    const response = await api.get(`/user/generations/${id}`)
    return response.data.data
  },

  async generateFromImage(imageOrFormData, providerId, modelId) {
    let formData
    if (imageOrFormData instanceof FormData) {
      formData = imageOrFormData
    } else {
      formData = new FormData()
      formData.append('image', imageOrFormData)
      if (providerId) formData.append('providerId', providerId)
      if (modelId) formData.append('modelId', modelId)
    }
    
    // Generation can take 1-3 minutes, so use longer timeout
    const response = await api.post('/user/generations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000 // 3 minutes timeout for generation
    })
    return response.data.data
  },

  async batchGenerateFromImages(imageFiles, providerId, modelId) {
    const formData = new FormData()
    imageFiles.forEach(file => formData.append('images', file))
    if (providerId) formData.append('providerId', providerId)
    if (modelId) formData.append('modelId', modelId)
    
    // Batch generation can take even longer
    const response = await api.post('/user/generations/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000 // 5 minutes timeout for batch
    })
    return response.data.data
  },

  async batchGenerateFromImagesStream(imageFiles, providerId, modelId, options = {}, onProgress, onComplete, onError) {
    // Handle old signature where options was onProgress
    let opts = options
    let progCb = onProgress
    let compCb = onComplete
    let errCb = onError
    
    // If options is actually a function (old signature), shift params
    if (typeof options === 'function') {
      opts = {}
      progCb = options
      compCb = onProgress
      errCb = onError
    }

    const formData = new FormData()
    imageFiles.forEach((file, i) => {
      console.log(`[Batch Stream] Appending file ${i}: ${file.name}, size: ${file.size}, type: ${file.type}`)
      formData.append('images', file)
    })
    if (providerId) formData.append('providerId', providerId)
    if (modelId) formData.append('modelId', modelId)
    if (opts.keywordCount) formData.append('keywordCount', opts.keywordCount)
    if (opts.negativeKeywords) formData.append('negativeKeywords', JSON.stringify(opts.negativeKeywords))
    if (opts.delayMs) {
      console.log('[Batch Stream] Sending delayMs:', opts.delayMs)
      formData.append('delayMs', String(opts.delayMs))
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api'
    const token = localStorage.getItem('accessToken')

    if (!token) {
      errCb?.(new Error('Not authenticated. Please login again.'))
      return { abort: () => {} }
    }

    console.log('[Batch Stream] Total files in FormData:', formData.getAll('images').length)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

    try {
      console.log('[Batch Stream] Starting request...')
      console.log('[Batch Stream] Token exists:', !!token)
      
      const response = await fetch(`${baseURL}/user/generations/batch-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
        signal: controller.signal
      })

      console.log('[Batch Stream] Response status:', response.status)

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        // Decode the chunk
        buffer += decoder.decode(value, { stream: true })
        
        // Process SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let currentEvent = 'message' // Default event type
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          
          if (trimmedLine.startsWith('event: ')) {
            currentEvent = trimmedLine.substring(7).trim()
            continue
          }
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.substring(6))
              console.log(`[SSE] Received ${currentEvent} event:`, data)
              
              if (data.type === 'complete' || currentEvent === 'complete') {
                console.log('[SSE] Stream complete')
                compCb?.(data)
              } else {
                progCb?.(data)
              }
            } catch (e) {
              console.warn('[SSE] Failed to parse event:', e, 'Line:', trimmedLine)
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.trim().substring(6))
          if (data.type === 'complete') {
            compCb?.(data)
          } else {
            progCb?.(data)
          }
        } catch (e) {
          console.warn('[SSE] Failed to parse remaining buffer:', e)
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        errCb?.(new Error('Request timeout'))
      } else {
        errCb?.(error)
      }
    }

    return { abort: () => controller.abort() }
  },

  async getSubscription() {
    const response = await api.get('/user/subscription')
    return response.data.data
  },

  async getCredits() {
    const response = await api.get('/user/credits')
    return response.data.data
  },

  async getPackages() {
    const response = await api.get('/user/packages')
    return response.data.data
  },

  async getPaymentMethods() {
    const response = await api.get('/user/payment-methods')
    return response.data.data
  },

  async getBYOKKeys() {
    const response = await api.get('/user/byok-keys')
    return response.data.data
  },

  async createBYOKKey(providerId, name, apiKey) {
    const response = await api.post('/user/byok-keys', { providerId, name, apiKey })
    return response.data.data
  },

  async updateBYOKKey(id, data) {
    const response = await api.patch(`/user/byok-keys/${id}`, data)
    return response.data.data
  },

  async deleteBYOKKey(id) {
    const response = await api.delete(`/user/byok-keys/${id}`)
    return response.data.data
  },

  async rollBYOKKey(id) {
    const response = await api.post(`/user/byok-keys/${id}/roll`)
    return response.data.data
  },

  async fetchModelsFromBYOK(id) {
    const response = await api.post(`/user/byok-keys/${id}/fetch-models`)
    return response.data.data
  }
}
