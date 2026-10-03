import { createRouter, createWebHistory } from 'vue-router'
import LogBPTab from './components/LogBPTab.vue'
import ChartsTab from './components/ChartsTab.vue'
import AnalyticsTab from './components/AnalyticsTab.vue'
import ImportTab from './components/ImportTab.vue'

// Every route except /public requires login; App.vue shows the login screen when needed.
const routes = [
  { path: '/', redirect: '/log' },
  { path: '/log', component: LogBPTab, meta: { tab: 'Log' } },
  { path: '/charts', component: ChartsTab, meta: { tab: 'Charts' } },
  { path: '/analytics', component: AnalyticsTab, meta: { tab: 'Analytics' } },
  { path: '/import', component: ImportTab, meta: { tab: 'Import' } },
  // Preview of what the shared /public link shows
  { path: '/public-view', component: ChartsTab, props: { publicView: true }, meta: { tab: 'Public' } },
  { path: '/public', component: ChartsTab, props: { publicView: true }, meta: { isPublic: true } },
  { path: '/:pathMatch(.*)*', redirect: '/log' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export const tabs = routes.filter(route => route.meta?.tab)

export default router
