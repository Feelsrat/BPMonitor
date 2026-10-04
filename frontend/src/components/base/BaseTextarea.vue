<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <textarea
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :rows="rows"
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
    ></textarea>
  </div>
</template>

<script setup>
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, default: '' },
  rows: { type: [String, Number], default: 2 },
})

const id = useId()
</script>
