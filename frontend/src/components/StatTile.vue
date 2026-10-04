<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4">
    <p class="text-sm text-slate-500">{{ label }}</p>
    <p class="mt-1 text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">
      {{ value }}
      <span v-if="unit" class="text-xs font-normal text-slate-500 sm:text-sm">{{ unit }}</span>
    </p>
    <p v-if="detail" class="mt-1 text-xs text-slate-500">{{ detail }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '-' },
  unit: { type: String, default: '' },
  detail: { type: String, default: '' },
})
</script>
