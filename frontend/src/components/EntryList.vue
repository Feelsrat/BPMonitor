<template>
  <div>
    <p v-if="entries.length === 0" class="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">No readings in this period.</p>

    <div v-for="day in visibleDays" :key="day.key" class="border-t border-slate-100 first:border-t-0">
      <div class="flex items-baseline justify-between bg-slate-50 px-4 py-2 sm:px-5">
        <h3 class="text-sm font-medium text-slate-700">
          {{ formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}
        </h3>
        <p v-if="day.entries.length > 1" class="text-xs tabular-nums text-slate-500">
          avg {{ formatBP(day.summary.systolic.avg, day.summary.diastolic.avg) }}, {{ day.summary.pulse.avg }} bpm
        </p>
      </div>
      <ul>
        <li
          v-for="entry in day.entries"
          :key="entry.id"
          :role="editable ? 'button' : undefined"
          :tabindex="editable ? 0 : undefined"
          :aria-label="editable ? `Edit reading from ${formatTime(entry.timestamp)}` : undefined"
          :class="[
            'grid grid-cols-[3.5rem_1fr] items-center gap-x-3 px-4 py-2.5 sm:grid-cols-[4rem_7rem_5rem_1fr_auto] sm:px-5',
            editable && 'group cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none',
          ]"
          @click="editable && $emit('edit', entry)"
          @keydown.enter="editable && $emit('edit', entry)"
        >
          <span class="text-sm tabular-nums text-slate-500">{{ formatTime(entry.timestamp) }}</span>
          <span class="font-semibold tabular-nums text-slate-900">
            {{ formatBP(entry.systolic, entry.diastolic) }}
            <span class="text-xs font-normal text-slate-400">mmHg</span>
          </span>
          <span class="hidden text-sm tabular-nums text-slate-600 sm:inline">{{ entry.pulse }} <span class="text-xs text-slate-400">bpm</span></span>
          <span class="col-start-2 truncate text-sm text-slate-500 sm:col-start-auto">
            <span class="sm:hidden">{{ entry.pulse }} bpm<template v-if="showNotes && entry.notes"> · </template></span>
            <template v-if="showNotes">{{ entry.notes }}</template>
          </span>
          <span v-if="editable" class="hidden text-sm text-slate-400 opacity-0 group-hover:opacity-100 sm:inline">Edit</span>
        </li>
      </ul>
    </div>

    <div v-if="days.length > visibleCount" class="border-t border-slate-100 p-3 text-center">
      <BaseButton variant="ghost" size="sm" @click="visibleCount += 14">
        Show more ({{ days.length - visibleCount }} more days)
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { byDay, summarize, formatDate, formatTime, formatBP } from '../utils/bp'

const props = defineProps({
  // Newest first
  entries: { type: Array, required: true },
  editable: { type: Boolean, default: false },
  showNotes: { type: Boolean, default: true },
})

defineEmits(['edit'])

const visibleCount = ref(14)
watch(() => props.entries, () => (visibleCount.value = 14))

const days = computed(() => byDay(props.entries).map(day => ({ ...day, summary: summarize(day.entries) })))
const visibleDays = computed(() => days.value.slice(0, visibleCount.value))
</script>
