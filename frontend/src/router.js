import { createRouter, createWebHistory } from 'vue-router'
import LogView from './views/LogView.vue'
import HistoryView from './views/HistoryView.vue'
import ExportView from './views/ExportView.vue'
import SettingsView from './views/SettingsView.vue'

// Every route except /public requires login; App.vue shows the login screen when needed.
export const navItems = [
  { path: '/', label: 'Log', title: 'Log a reading', icon: 'M12 5v14M5 12h14' },
  { path: '/history', label: 'History', title: 'History', icon: 'M4 19h16M5 15l4-5 4 3 6-7' },
  { path: '/export', label: 'Export', title: 'Export', icon: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14' },
  { path: '/settings', label: 'Settings', title: 'Settings', icon: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4' },
]

const components = { '/': LogView, '/history': HistoryView, '/export': ExportView, '/settings': SettingsView }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...navItems.map(item => ({ path: item.path, component: components[item.path], meta: { title: item.title } })),
    { path: '/public', component: HistoryView, props: { publicView: true }, meta: { isPublic: true, title: 'Shared readings' } },
    // Old tab URLs
    { path: '/log', redirect: '/' },
    { path: '/charts', redirect: '/history' },
    { path: '/analytics', redirect: '/history' },
    { path: '/import', redirect: '/settings' },
    { path: '/public-view', redirect: '/settings' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - BP Monitor` : 'BP Monitor'
})

export default router
