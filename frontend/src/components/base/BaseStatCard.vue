<template>
  <BaseCard>
    <p class="text-gray-600 text-sm mb-2">{{ label }}</p>
    <p class="text-3xl font-bold text-gray-800">{{ value ?? '-' }}</p>
    <p v-if="subtitle" class="text-xs text-gray-500 mt-2">{{ subtitle }}</p>
  </BaseCard>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: '-'
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>
