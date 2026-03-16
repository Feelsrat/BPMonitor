<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="mb-4">
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  padding: {
    type: String,
    default: 'p-6',
    validator: (value) => ['p-4', 'p-6', 'p-8', 'none'].includes(value)
  }
})

const cardClasses = computed(() => {
  const base = 'bg-white rounded-lg shadow-md'
  const padding = props.padding === 'none' ? '' : props.padding
  
  return [base, padding].filter(Boolean).join(' ')
})
</script>
