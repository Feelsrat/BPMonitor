<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Public View (no authentication required) -->
    <div v-if="isPublicView">
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">BP Monitor - Public View</h1>
          <div class="text-sm text-gray-600">Read-only view</div>
        </div>
      </header>
      <PublicViewTab />
    </div>

    <!-- Login Modal -->
    <div v-else-if="!isAuthenticated" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-2 text-center">BP Monitor</h2>
        <p class="text-sm text-gray-600 text-center mb-6">Enter your password to access</p>
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
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs text-blue-800">
            <strong>Local Development:</strong> Default password is "defaultpassword"
          </p>
          <p class="text-xs text-blue-700 mt-1">
            Set PWORD in .env file to change it
          </p>
        </div>
      </div>
    </div>

    <!-- Main App (visible only when authenticated) -->
    <div v-else-if="isAuthenticated">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">BP Monitor</h1>
          <div class="flex gap-2">
            <BaseButton 
              v-if="activeTab === 'public'" 
              variant="success" 
              @click="copyPublicLink"
            >
              {{ linkCopied ? '✓ Copied!' : '🔗 Copy Share Link' }}
            </BaseButton>
            <BaseButton variant="danger" @click="logout">
              Logout
            </BaseButton>
          </div>
        </div>
      </header>
      
      <!-- Tab Navigation -->
      <div class="flex gap-2 bg-white border-b sticky top-0 z-10">
        <BaseButton
          variant="tab"
          :active="activeTab === 'log'"
          @click="activeTab = 'log'"
        >
          📝 Log BP
        </BaseButton>
        <BaseButton
          variant="tab"
          :active="activeTab === 'charts'"
          @click="activeTab = 'charts'"
        >
          📊 Charts
        </BaseButton>
        <BaseButton
          variant="tab"
          :active="activeTab === 'analytics'"
          @click="activeTab = 'analytics'"
        >
          📈 Analytics
        </BaseButton>
        <BaseButton
          variant="tab"
          :active="activeTab === 'import'"
          @click="activeTab = 'import'"
        >
          📥 Import
        </BaseButton>
        <BaseButton
          variant="tab"
          :active="activeTab === 'public'"
          @click="activeTab = 'public'"
        >
          🔗 Public View
        </BaseButton>
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
      <AnalyticsTab 
        v-if="activeTab === 'analytics'"
      />
      <ImportTab 
        v-if="activeTab === 'import'"
        @import-complete="onImportComplete"
      />
      <PublicViewTab 
        v-if="activeTab === 'public'"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LogBPTab from './components/LogBPTab.vue';
import ChartsTab from './components/ChartsTab.vue';
import ImportTab from './components/ImportTab.vue';
import PublicViewTab from './components/PublicViewTab.vue';
import AnalyticsTab from './components/AnalyticsTab.vue';
import { authenticate, setAuthToken } from './services/api';

const activeTab = ref('log');
const chartsRefreshKey = ref(0);
const isAuthenticated = ref(false);
const isLoggingIn = ref(false);
const password = ref('');
const loginError = ref('');
const isPublicView = ref(false);
const linkCopied = ref(false);

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
  // Check if we should return to public view  
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicParam = urlParams.get('view') === 'public';
  const isPublicPath = window.location.pathname === '/public' || window.location.pathname.endsWith('/public');
  
  if (isPublicParam || isPublicPath) {
    isPublicView.value = true;
  }
  password.value = '';
  loginError.value = '';
};

const copyPublicLink = async () => {
  const publicUrl = `${window.location.origin}/public`
  try {
    await navigator.clipboard.writeText(publicUrl)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
};

onMounted(() => {
  // Check if this is a public view request (both ?view=public and /public path)
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicParam = urlParams.get('view') === 'public';
  const isPublicPath = window.location.pathname === '/public' || window.location.pathname.endsWith('/public');
  
  if (isPublicParam || isPublicPath) {
    isPublicView.value = true;
    return; // Skip authentication check
  }
  
  // Otherwise check for saved authentication
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    isAuthenticated.value = true;
  }
});
</script>
