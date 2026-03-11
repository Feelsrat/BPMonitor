<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">BP Monitor</h1>
        <p class="text-center text-gray-600 mb-8">Track your blood pressure</p>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              :disabled="loading"
            />
          </div>
          
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
          
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { login } from '../services/api'
import { setToken } from '../utils/storage'

export default {
  name: 'LoginTab',
  emits: ['authenticated'],
  setup(_, { emit }) {
    const password = ref('')
    const loading = ref(false)
    const error = ref('')
    
    const handleLogin = async () => {
      if (!password.value.trim()) {
        error.value = 'Please enter your password'
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const response = await login(password.value)
        setToken(response.data.access)
        emit('authenticated')
      } catch (err) {
        error.value = err.response?.data?.detail || 'Login failed. Please try again.'
      } finally {
        loading.value = false
      }
    }
    
    return {
      password,
      loading,
      error,
      handleLogin,
    }
  },
}
</script>
