<template>
  <section class="rounded-xl border border-slate-200 bg-white">
    <header v-if="title || $slots.actions" class="flex items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5">
      <div>
        <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-sm text-slate-500">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div :class="flush ? '' : 'p-4 sm:p-5'">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  // No inner padding, for tables that run edge to edge
  flush: { type: Boolean, default: false },
})
</script>
