<template>
  <div class="relative" :style="{ height }">
    <canvas ref="canvas" role="img" :aria-label="label"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Chart } from 'chart.js'

const props = defineProps({
  config: { type: Object, required: true },
  height: { type: String, default: '18rem' },
  label: { type: String, default: 'Chart' },
})

const canvas = ref(null)
let chart = null

onMounted(() => {
  chart = new Chart(canvas.value, props.config)
})

watch(() => props.config, (config) => {
  chart.data = config.data
  chart.options = config.options
  chart.update('none')
})

onBeforeUnmount(() => chart?.destroy())
</script>
