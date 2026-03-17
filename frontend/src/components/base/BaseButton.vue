<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
  >
    <span v-if="loading" class="inline-block mr-2">⏳</span>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'small', 'filter', 'tab'].includes(value)
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})

const buttonClasses = computed(() => {
  const base = 'font-semibold rounded-lg transition duration-200 focus:outline-none focus:ring-2'
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 focus:ring-blue-500',
    secondary: 'bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-2 px-4 focus:ring-gray-400',
    success: 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 focus:ring-red-500',
    small: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-sm rounded-md focus:ring-gray-300',
    filter: props.active 
      ? 'bg-blue-600 text-white px-4 py-2 focus:ring-blue-500'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 focus:ring-gray-300',
    tab: props.active
      ? 'border-b-2 border-blue-600 text-blue-600 px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap rounded-none focus:ring-blue-500'
      : 'text-gray-600 hover:text-gray-800 px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap rounded-none focus:ring-gray-300'
  }
  
  const width = props.fullWidth ? 'w-full' : ''
  
  return [base, variants[props.variant], width].filter(Boolean).join(' ')
})
</script>
