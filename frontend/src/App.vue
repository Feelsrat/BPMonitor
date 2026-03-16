<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Login Modal -->
    <div v-if="!isAuthenticated" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">BP Monitor</h2>
        <form @submit.prevent="login" class="space-y-4">
          <BaseInput
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter password"
          />
          <BaseButton
            type="submit"
            variant="primary"
            :loading="isLoggingIn"
            :disabled="isLoggingIn"
            full-width
          >
            {{ isLoggingIn ? 'Logging in...' : 'Log In' }}
          </BaseButton>
        </form>
        <BaseAlert v-if="loginError" type="error" class="mt-4">
          {{ loginError }}
        </BaseAlert>
      </div>
    </div>

    <!-- Main App (visible only when authenticated) -->
    <div v-if="isAuthenticated">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">BP Monitor</h1>
          <BaseButton variant="danger" @click="logout">
            Logout
          </BaseButton>
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

<script setup>
import { ref, onMounted } from 'vue';
import LogBPTab from './components/LogBPTab.vue';
import ChartsTab from './components/ChartsTab.vue';
import ImportTab from './components/ImportTab.vue';
import { authenticate, setAuthToken } from './services/api';

const activeTab = ref('log');
const chartsRefreshKey = ref(0);
const isAuthenticated = ref(false);
const isLoggingIn = ref(false);
const password = ref('');
const loginError = ref('');

const refreshCharts = () => {
  chartsRefreshKey.value += 1;
  setTimeout(() => {
    activeTab.value = 'charts';
  }, 500);
};

const onImportComplete = () => {
  chartsRefreshKey.value += 1;
  setTimeout(() => {
    activeTab.value = 'charts';
  }, 500);
};

const login = async () => {
  isLoggingIn.value = true;
  loginError.value = '';
  
  try {
    const response = await authenticate(password.value);
    if (response.data.success && response.data.token) {
      setAuthToken(response.data.token);
      isAuthenticated.value = true;
      password.value = '';
    }
  } catch (error) {
    if (error.response?.status === 403) {
      loginError.value = 'Access denied.';
    } else if (error.response?.status === 401) {
      loginError.value = 'Invalid password';
    } else {
      loginError.value = 'Login failed. Please try again.';
    }
  } finally {
    isLoggingIn.value = false;
  }
};

const logout = () => {
  setAuthToken(null);
  isAuthenticated.value = false;
  password.value = '';
  loginError.value = '';
};

onMounted(() => {
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    isAuthenticated.value = true;
  }
});
</script>
