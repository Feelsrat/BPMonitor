<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="unit" class="font-normal text-slate-400">{{ unit }}</span>
    </label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="type"
      class="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
    />
  </div>
</template>

<script setup>
import { useId } from 'vue'

// Extra attributes (placeholder, min, max, required, ...) go to the <input>
defineOptions({ inheritAttrs: false })

const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  label: { type: String, default: '' },
  unit: { type: String, default: '' },
  type: { type: String, default: 'text' },
})

const id = useId()
</script>
