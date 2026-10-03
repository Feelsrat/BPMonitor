<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Shareable read-only view, no login required -->
    <template v-if="route.meta.isPublic">
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">BP Monitor</h1>
          <div class="text-sm text-gray-600">Read-only view</div>
        </div>
      </header>
      <router-view />
    </template>

    <!-- Login -->
    <div v-else-if="!authToken" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-2 text-center">BP Monitor</h2>
        <p class="text-sm text-gray-600 text-center mb-6">Enter your password to access</p>
        <form @submit.prevent="login" class="space-y-4">
          <BaseInput v-model="password" type="password" label="Password" placeholder="Enter password" />
          <BaseButton type="submit" variant="primary" :loading="isLoggingIn" full-width>
            {{ isLoggingIn ? 'Logging in...' : 'Log In' }}
          </BaseButton>
        </form>
        <BaseAlert v-if="loginError" type="error" class="mt-4">
          {{ loginError }}
        </BaseAlert>
      </div>
    </div>

    <!-- Main app -->
    <template v-else>
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">BP Monitor</h1>
          <div class="flex gap-1 sm:gap-2">
            <BaseButton
              v-if="route.path === '/public-view'"
              variant="success"
              class="text-xs sm:text-sm"
              @click="copyPublicLink"
            >
              {{ linkCopied ? 'Copied!' : 'Copy Share Link' }}
            </BaseButton>
            <BaseButton variant="danger" class="text-xs sm:text-sm" @click="setAuthToken(null)">
              Logout
            </BaseButton>
          </div>
        </div>
      </header>

      <nav class="overflow-x-auto bg-white border-b sticky top-0 z-10">
        <div class="max-w-6xl mx-auto flex gap-1 sm:gap-2 min-w-max px-2">
          <BaseButton
            v-for="tab in tabs"
            :key="tab.path"
            variant="tab"
            :active="route.path === tab.path"
            class="text-xs sm:text-sm"
            @click="router.push(tab.path)"
          >
            {{ tab.meta.tab }}
          </BaseButton>
        </div>
      </nav>

      <router-view @saved="router.push('/charts')" />
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authenticate, authToken, setAuthToken, errorMessage } from './services/api'
import { tabs } from './router'

const router = useRouter()
const route = useRoute()

const isLoggingIn = ref(false)
const password = ref('')
const loginError = ref('')
const linkCopied = ref(false)

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

const copyPublicLink = async () => {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/public`)
    linkCopied.value = true
    setTimeout(() => (linkCopied.value = false), 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
</script>
