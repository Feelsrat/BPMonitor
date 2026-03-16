<template>
  <div v-if="modelValue || show" :class="alertClasses">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  modelValue: {
    type: String,
    default: ''
  },
  show: {
    type: Boolean,
    default: false
  }
})

const alertClasses = computed(() => {
  const base = 'px-4 py-3 rounded-lg border'
  
  const types = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }
  
  return [base, types[props.type]].join(' ')
})
</script>
