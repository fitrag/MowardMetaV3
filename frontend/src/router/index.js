import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/authService'

const routes = [
  // Public routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { requiresGuest: true }
  },

  // User routes
  {
    path: '/user',
    component: () => import('../layouts/UserLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'UserDashboard',
        component: () => import('../views/user/Dashboard.vue')
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('../views/user/Orders.vue')
      },
      {
        path: 'orders/:id',
        name: 'UserOrderDetail',
        component: () => import('../views/user/OrderDetail.vue')
      },
      {
        path: 'generations',
        name: 'UserGenerations',
        component: () => import('../views/user/Generations.vue')
      },
      {
        path: 'generate',
        name: 'UserGenerate',
        component: () => import('../views/user/Generate.vue')
      },
      {
        path: 'generations/:id',
        name: 'UserGenerationDetail',
        component: () => import('../views/user/GenerationDetail.vue')
      },
      {
        path: 'subscription',
        name: 'UserSubscription',
        component: () => import('../views/user/Subscription.vue')
      },
      {
        path: 'byok',
        name: 'UserBYOK',
        component: () => import('../views/user/BYOK.vue')
      },
      {
        path: 'packages',
        name: 'UserPackages',
        component: () => import('../views/user/Packages.vue')
      },
      {
        path: 'topup',
        name: 'UserTopUp',
        component: () => import('../views/user/TopUp.vue')
      }
    ]
  },

  // Operator routes
  {
    path: '/operator',
    component: () => import('../layouts/OperatorLayout.vue'),
    meta: { requiresAuth: true, role: 'operator' },
    children: [
      {
        path: '',
        name: 'OperatorDashboard',
        component: () => import('../views/operator/Dashboard.vue')
      },
      {
        path: 'orders',
        name: 'OperatorOrders',
        component: () => import('../views/operator/Orders.vue')
      },
      {
        path: 'orders/:id',
        name: 'OperatorOrderDetail',
        component: () => import('../views/operator/OrderDetail.vue')
      },
      {
        path: 'users',
        name: 'OperatorUsers',
        component: () => import('../views/operator/Users.vue')
      },
      {
        path: 'generations',
        name: 'OperatorGenerations',
        component: () => import('../views/operator/Generations.vue')
      }
    ]
  },

  // Admin routes
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue')
      },
      {
        path: 'users/:id',
        name: 'AdminUserDetail',
        component: () => import('../views/admin/Users.vue') // Reusing Users view for now
      },
      {
        path: 'providers',
        name: 'AdminProviders',
        component: () => import('../views/admin/Providers.vue')
      },
      {
        path: 'providers/:id',
        name: 'AdminProviderDetail',
        component: () => import('../views/admin/ProviderDetail.vue')
      },
      {
        path: 'packages',
        name: 'AdminPackages',
        component: () => import('../views/admin/Packages.vue')
      },
      {
        path: 'payment-methods',
        name: 'AdminPaymentMethods',
        component: () => import('../views/admin/PaymentMethods.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/admin/Orders.vue')
      },
      {
        path: 'orders/:id',
        name: 'AdminOrderDetail',
        component: () => import('../views/admin/OrderDetail.vue')
      },
      {
        path: 'coupons',
        name: 'AdminCoupons',
        component: () => import('../views/admin/Coupons.vue')
      },
      {
        path: 'subscriptions',
        name: 'AdminSubscriptions',
        component: () => import('../views/admin/Packages.vue') // Reusing Packages view
      },
      {
        path: 'api-keys',
        name: 'AdminApiKeys',
        component: () => import('../views/admin/ApiKeys.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.vue')
      }
    ]
  },

  // Default redirect
  {
    path: '/',
    redirect: '/user'
  },

  // Catch all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUserFromStorage()

  // Requires guest (login/register)
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/user')
    return
  }

  // Requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Role-based access
  if (to.meta.role && user?.role !== to.meta.role && user?.role !== 'admin') {
    next('/user')
    return
  }

  next()
})

export default router
