<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Login Modal -->
    <div v-if="!isAuthenticated" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">BP Monitor</h2>
        <form @submit.prevent="login" class="space-y-4">
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoggingIn"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {{ isLoggingIn ? 'Logging in...' : 'Log In' }}
          </button>
        </form>
        <div v-if="loginError" class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ loginError }}
        </div>
      </div>
    </div>

    <!-- Main App (visible only when authenticated) -->
    <div v-if="isAuthenticated">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">BP Monitor</h1>
          <button
            @click="logout"
            class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </header>
      
      <!-- Tab Navigation -->
      <div class="flex gap-2 bg-white border-b sticky top-0 z-10">
        <button
          @click="activeTab = 'log'"
          :class="[
            'px-4 py-3 font-semibold whitespace-nowrap',
            activeTab === 'log'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          📝 Log BP
        </button>
        <button
          @click="activeTab = 'charts'"
          :class="[
            'px-4 py-3 font-semibold whitespace-nowrap',
            activeTab === 'charts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          📊 Charts
        </button>
        <button
          @click="activeTab = 'import'"
          :class="[
            'px-4 py-3 font-semibold whitespace-nowrap',
            activeTab === 'import'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          ]"
        >
          📥 Import
        </button>
      </div>
      
      <!-- Tab Content -->
      <LogBPTab 
        v-if="activeTab === 'log'"
        @entry-created="refreshCharts"
      />
      <ChartsTab 
        v-if="activeTab === 'charts'"
        :key="chartsRefreshKey"
      />
      <ImportTab 
        v-if="activeTab === 'import'"
        @import-complete="onImportComplete"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import LogBPTab from './components/LogBPTab.vue'
import ChartsTab from './components/ChartsTab.vue'
import ImportTab from './components/ImportTab.vue'
import { authenticate, setAuthToken } from './services/api'

export default {
  name: 'App',
  components: {
    LogBPTab,
    ChartsTab,
    ImportTab,
  },
  setup() {
    const activeTab = ref('log')
    const chartsRefreshKey = ref(0)
    const isAuthenticated = ref(false)
    const isLoggingIn = ref(false)
    const password = ref('')
    const loginError = ref('')
    
    const refreshCharts = () => {
      chartsRefreshKey.value += 1
      setTimeout(() => {
        activeTab.value = 'charts'
      }, 500)
    }
    
    const onImportComplete = () => {
      // Refresh charts after successful import and switch to charts tab
      chartsRefreshKey.value += 1
      setTimeout(() => {
        activeTab.value = 'charts'
      }, 500)
    }
    
    const login = async () => {
      isLoggingIn.value = true
      loginError.value = ''
      
      try {
        const response = await authenticate(password.value)
        if (response.data.success && response.data.token) {
          setAuthToken(response.data.token)
          isAuthenticated.value = true
          password.value = ''
        }
      } catch (error) {
        if (error.response?.status === 403) {
          loginError.value = 'Access denied.'
        } else if (error.response?.status === 401) {
          loginError.value = 'Invalid password'
        } else {
          loginError.value = 'Login failed. Please try again.'
        }
      } finally {
        isLoggingIn.value = false
      }
    }
    
    const logout = () => {
      setAuthToken(null)
      isAuthenticated.value = false
      password.value = ''
      loginError.value = ''
    }
    
    onMounted(() => {
      // Check if we have a saved token
      const savedToken = localStorage.getItem('authToken')
      if (savedToken) {
        isAuthenticated.value = true
      }
    })
    
    return {
      activeTab,
      chartsRefreshKey,
      refreshCharts,
      onImportComplete,
      isAuthenticated,
      isLoggingIn,
      password,
      loginError,
      login,
      logout,
    }
  },
}
</script>
