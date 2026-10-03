<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <textarea
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :rows="rows"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
    ></textarea>
  </div>
</template>

<script setup>
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, default: '' },
  rows: { type: [String, Number], default: 3 },
})

const id = useId()
</script>
