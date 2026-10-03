<template>
  <div :class="['bg-white rounded-lg shadow-md', padding]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  padding: { type: String, default: 'p-6' },
})
</script>
