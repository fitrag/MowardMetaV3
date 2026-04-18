<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">User Management</h2>
          <p class="text-sm text-gray-400 mt-1">Manage user accounts and permissions</p>
        </div>
        <button @click="openCreateModal" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
          <PlusIcon class="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Total Users</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ users.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-emerald-600">Active</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ users.filter(u => u.status === 'active').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Admins</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ users.filter(u => u.role === 'admin').length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-xs text-gray-400">Operators</p>
        <p class="text-xl font-semibold text-gray-900 mt-0.5">{{ users.filter(u => u.role === 'operator').length }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-xl border border-gray-100 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search by name or email..." class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
        </div>
        <select v-model="roleFilter" class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      <p class="mt-3 text-sm text-gray-400">Loading users...</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <UsersIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
      <h3 class="text-sm font-medium text-gray-900 mb-1">No users found</h3>
      <p class="text-xs text-gray-500">Try adjusting your filters</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="user in filteredUsers" :key="user.id" class="transition-colors hover:bg-gray-50/50">
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <span class="text-xs font-semibold text-gray-600">{{ getInitials(user.name) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate max-w-[150px]">{{ user.name }}</p>
                    <p class="text-xs text-gray-400 truncate max-w-[150px]">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="getRoleBadge(user.role)">{{ user.role }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span :class="user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ user.status }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900">{{ user.currentCredit || 0 }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">{{ user.accountType || '—' }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="text-xs text-gray-400">{{ formatDate(user.createdAt) }}</span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="handleEdit(user)" class="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="handleDelete(user.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="closeModal">
        <div class="bg-white rounded-xl max-w-md w-full p-6" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingUser ? 'Edit User' : 'Create User' }}</h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input v-model="form.email" type="email" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" />
            </div>
            <div v-if="!editingUser">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input v-model="form.password" type="password" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900" minlength="6" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select v-model="form.role" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="user">User</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select v-model="form.status" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50" :disabled="submitting">{{ submitting ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, UsersIcon } from '@heroicons/vue/24/outline'
import { adminService } from '../../services/adminService'

const users = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingUser = ref(null)
const submitting = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const form = ref({ name: '', email: '', password: '', role: 'user', status: 'active' })

const filteredUsers = computed(() => {
  let result = users.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }
  if (roleFilter.value) {
    result = result.filter(u => u.role === roleFilter.value)
  }
  return result
})

onMounted(async () => {
  try {
    users.value = await adminService.getUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
})

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleBadge = (role) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize'
  const map = { admin: 'bg-rose-50 text-rose-700', operator: 'bg-amber-50 text-amber-700', user: 'bg-gray-100 text-gray-600' }
  return `${base} ${map[role] || 'bg-gray-50 text-gray-600'}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const openCreateModal = () => {
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: 'user', status: 'active' }
  showCreateModal.value = true
}

const handleEdit = (user) => {
  editingUser.value = user
  form.value = { name: user.name, email: user.email, role: user.role, status: user.status }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingUser.value) {
      await adminService.updateUser(editingUser.value.id, form.value)
    } else {
      await adminService.createUser(form.value)
    }
    closeModal()
    users.value = await adminService.getUsers()
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to save user')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this user?')) return
  try {
    await adminService.deleteUser(id)
    users.value = users.value.filter(u => u.id !== id)
  } catch (error) {
    alert('Failed to delete user')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: 'user', status: 'active' }
}
</script>
