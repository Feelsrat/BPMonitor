<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Login -->
    <div v-if="!route.meta.isPublic && !authToken" class="flex min-h-screen items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="mb-6 text-center">
          <AppMark class="mx-auto mb-3 h-10 w-10" />
          <h1 class="text-xl font-semibold">BP Monitor</h1>
        </div>
        <BaseCard>
          <form class="space-y-4" @submit.prevent="login">
            <BaseInput v-model="password" type="password" label="Password" autocomplete="current-password" required autofocus />
            <BaseAlert v-if="loginError" type="error">{{ loginError }}</BaseAlert>
            <BaseButton type="submit" :loading="isLoggingIn" full-width>Log in</BaseButton>
          </form>
        </BaseCard>
      </div>
    </div>

    <template v-else>
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <RouterLink :to="route.meta.isPublic ? '/public' : '/'" class="flex items-center gap-2 font-semibold">
            <AppMark class="h-6 w-6" />
            BP Monitor
          </RouterLink>
          <nav v-if="!route.meta.isPublic" class="hidden gap-1 sm:flex">
            <RouterLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              exact-active-class="!bg-slate-100 !text-slate-900"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
          <span v-else class="text-sm text-slate-500">Read-only</span>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pb-12">
        <h1 class="mb-5 text-2xl font-semibold tracking-tight">{{ route.meta.title }}</h1>
        <RouterView />
      </main>

      <!-- Mobile tab bar -->
      <nav v-if="!route.meta.isPublic" class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-slate-500"
          exact-active-class="!text-slate-900"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          {{ item.label }}
        </RouterLink>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { ref, h } from 'vue'
import { useRoute } from 'vue-router'
import { authenticate, authToken, setAuthToken, errorMessage } from './services/api'
import { navItems } from './router'

const route = useRoute()

const AppMark = (props) => h('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', ...props }, [
  h('rect', { width: 24, height: 24, rx: 6, fill: '#0f172a' }),
  h('path', { d: 'M4 13h4l2-5 3 9 2-4h5', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
])

const isLoggingIn = ref(false)
const password = ref('')
const loginError = ref('')

const login = async () => {
  isLoggingIn.value = true
  loginError.value = ''
  try {
    const { data } = await authenticate(password.value)
    setAuthToken(data.token)
    password.value = ''
  } catch (error) {
    loginError.value = errorMessage(error, 'Login failed. Please try again.')
  } finally {
    isLoggingIn.value = false
  }
}
</script>
