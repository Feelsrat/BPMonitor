<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="grid w-full grid-cols-6 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm sm:inline-flex sm:w-auto" role="tablist">
      <button
        v-for="preset in RANGE_PRESETS"
        :key="preset.id"
        type="button"
        role="tab"
        :aria-selected="model.preset === preset.id"
        :class="[
          'whitespace-nowrap rounded-md px-1 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
          model.preset === preset.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
        ]"
        @click="select(preset.id)"
      >
        {{ preset.label }}
      </button>
    </div>
    <div v-if="model.preset === 'custom'" class="flex items-center gap-2">
      <input v-model="model.from" type="date" aria-label="From" class="h-9 rounded-lg border border-slate-300 px-2 text-sm shadow-sm" />
      <span class="text-slate-400">to</span>
      <input v-model="model.to" type="date" aria-label="To" class="h-9 rounded-lg border border-slate-300 px-2 text-sm shadow-sm" />
    </div>
  </div>
</template>

<script setup>
import { RANGE_PRESETS, toLocalInput, DAY_MS } from '../utils/bp'

const model = defineModel({ type: Object, required: true })

const select = (preset) => {
  const next = { ...model.value, preset }
  // Start a custom range from the last 30 days rather than empty fields
  if (preset === 'custom' && !next.from) {
    next.from = toLocalInput(new Date(Date.now() - 29 * DAY_MS)).slice(0, 10)
    next.to = toLocalInput().slice(0, 10)
  }
  model.value = next
}
</script>
