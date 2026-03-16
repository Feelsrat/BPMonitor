import { createRouter, createWebHistory } from 'vue-router'
import LogBPTab from './components/LogBPTab.vue'
import ChartsTab from './components/ChartsTab.vue'
import AnalyticsTab from './components/AnalyticsTab.vue'
import ImportTab from './components/ImportTab.vue'
import PublicViewTab from './components/PublicViewTab.vue'

const routes = [
  {
    path: '/',
    redirect: '/log'
  },
  {
    path: '/log',
    name: 'log',
    component: LogBPTab,
    meta: { requiresAuth: true }
  },
  {
    path: '/charts',
    name: 'charts',
    component: ChartsTab,
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsTab,
    meta: { requiresAuth: true }
  },
  {
    path: '/import',
    name: 'import',
    component: ImportTab,
    meta: { requiresAuth: true }
  },
  {
    path: '/public-view',
    name: 'public-view-tab',
    component: PublicViewTab,
    meta: { requiresAuth: true }
  },
  {
    path: '/public',
    name: 'public',
    component: PublicViewTab,
    meta: { requiresAuth: false, isPublic: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken')
  
  // Public route - always allow
  if (to.meta.isPublic) {
    next()
    return
  }
  
  // Protected routes - check authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Stay on current route but don't navigate
    // The App.vue will show login modal
    next(false)
    return
  }
  
  next()
})

export default router
