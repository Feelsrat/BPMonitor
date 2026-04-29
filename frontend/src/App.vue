<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Public View (no authentication required) -->
    <div v-if="isPublicRoute">
      <header class="bg-white shadow">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800">BP Monitor - Public View</h1>
          <div class="text-sm text-gray-600">Read-only view</div>
        </div>
      </header>
      <router-view />
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
        <div class="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">BP Monitor</h1>
          <div class="flex gap-1 sm:gap-2">
            <BaseButton 
              v-if="currentRoute === '/public-view'" 
              variant="success" 
              @click="copyPublicLink"
              class="text-xs sm:text-sm px-2 sm:px-4"
            >
              <span class="hidden sm:inline">{{ linkCopied ? 'Copied!' : 'Copy Share Link' }}</span>
              <span class="sm:hidden">{{ linkCopied ? 'Copied' : 'Share' }}</span>
            </BaseButton>
            <BaseButton 
              variant="danger" 
              @click="logout"
              class="text-xs sm:text-sm px-2 sm:px-4"
            >
              <span class="hidden sm:inline">Logout</span>
              <span class="sm:hidden">Exit</span>
            </BaseButton>
          </div>
        </div>
      </header>
      
      <!-- Tab Navigation -->
      <div class="overflow-x-auto bg-white border-b sticky top-0 z-10">
        <div class="flex gap-1 sm:gap-2 min-w-max px-2 sm:px-0">
          <BaseButton
            variant="tab"
            :active="currentRoute === '/log'"
            @click="$router.push('/log')"
            class="text-xs sm:text-sm whitespace-nowrap"
          >
            <span>Log</span>
          </BaseButton>
          <BaseButton
            variant="tab"
            :active="currentRoute === '/charts'"
            @click="$router.push('/charts')"
            class="text-xs sm:text-sm whitespace-nowrap"
          >
            <span>Charts</span>
          </BaseButton>
          <BaseButton
            variant="tab"
            :active="currentRoute === '/analytics'"
            @click="$router.push('/analytics')"
            class="text-xs sm:text-sm whitespace-nowrap"
          >
            <span>Analytics</span>
          </BaseButton>
          <BaseButton
            variant="tab"
            :active="currentRoute === '/import'"
            @click="$router.push('/import')"
            class="text-xs sm:text-sm whitespace-nowrap"
          >
            <span>Import</span>
          </BaseButton>
          <BaseButton
            variant="tab"
            :active="currentRoute === '/public-view'"
            @click="$router.push('/public-view')"
            class="text-xs sm:text-sm whitespace-nowrap"
          >
            <span>Public</span>
          </BaseButton>
        </div>
      </div>
      
      <!-- Tab Content -->
      <router-view @entry-created="onEntryCreated" @import-complete="onImportComplete" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authenticate, setAuthToken } from './services/api';

const router = useRouter();
const route = useRoute();

const isAuthenticated = ref(false);
const isLoggingIn = ref(false);
const password = ref('');
const loginError = ref('');
const linkCopied = ref(false);

const currentRoute = computed(() => route.path);
const isPublicRoute = computed(() => route.path === '/public');

const onEntryCreated = () => {
  // Navigate to charts after entry is created
  setTimeout(() => {
    router.push('/charts');
  }, 500);
};

const onImportComplete = () => {
  // Navigate to charts after import
  setTimeout(() => {
    router.push('/charts');
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
      // Navigate to log page after login
      router.push('/log');
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
  
  // If on public route, stay there; otherwise go to home
  if (route.path !== '/public') {
    router.push('/');
  }
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

// Watch for route changes to handle authentication
watch(() => route.path, (newPath) => {
  // Public route doesn't need authentication
  if (newPath === '/public') {
    return;
  }
  
  // For other routes, check if authenticated
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    isAuthenticated.value = true;
  } else {
    isAuthenticated.value = false;
  }
});

onMounted(() => {
  // Check authentication status
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    isAuthenticated.value = true;
  }
  
  // If not on public route and not authenticated, show login
  if (route.path !== '/public' && !savedToken) {
    isAuthenticated.value = false;
  }
});
</script>
