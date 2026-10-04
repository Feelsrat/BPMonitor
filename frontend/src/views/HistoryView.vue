<template>
  <div class="space-y-6">
    <RangePicker v-model="range" />

    <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

    <div v-if="loading && !loaded" class="py-16 text-center text-sm text-slate-500">Loading readings…</div>

    <template v-else>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Average BP" :value="formatBP(stats.systolic.avg, stats.diastolic.avg)" unit="mmHg" :detail="comparison" />
        <StatTile label="Average pulse" :value="stats.pulse.avg ?? '-'" unit="bpm" />
        <StatTile label="Readings" :value="stats.count" :detail="stats.count ? `on ${stats.days} day${stats.days === 1 ? '' : 's'}` : ''" />
        <StatTile
          label="Range"
          :value="stats.count ? `${stats.systolic.min}-${stats.systolic.max}` : '-'"
          unit="sys"
          :detail="stats.count ? `diastolic ${stats.diastolic.min}-${stats.diastolic.max}` : ''"
        />
      </div>

      <template v-if="filtered.length">
        <BaseCard title="Blood pressure" :description="chartDescription">
          <TrendChart :config="bpChart" height="18rem" label="Blood pressure over time" />
        </BaseCard>

        <div class="grid gap-6 lg:grid-cols-5">
          <BaseCard title="Pulse" class="lg:col-span-3">
            <TrendChart :config="pulseChart" height="10rem" label="Pulse over time" />
          </BaseCard>

          <BaseCard title="By time of day" class="lg:col-span-2" flush>
            <table class="mt-2 w-full text-sm">
              <thead class="text-left text-xs text-slate-500">
                <tr>
                  <th class="px-4 py-2 font-medium sm:px-5">Time</th>
                  <th class="px-2 py-2 text-right font-medium">Readings</th>
                  <th class="px-2 py-2 text-right font-medium">Avg BP</th>
                  <th class="px-4 py-2 text-right font-medium sm:px-5">Pulse</th>
                </tr>
              </thead>
              <tbody class="tabular-nums">
                <tr v-for="slot in timeOfDay" :key="slot.label" class="border-t border-slate-100">
                  <td class="px-4 py-2 sm:px-5">
                    {{ slot.label }}
                    <span class="block text-xs text-slate-400">{{ slot.hours }}</span>
                  </td>
                  <td class="px-2 py-2 text-right text-slate-500">{{ slot.count }}</td>
                  <td class="px-2 py-2 text-right font-medium">{{ formatBP(slot.systolic.avg, slot.diastolic.avg) }}</td>
                  <td class="px-4 py-2 text-right sm:px-5">{{ slot.pulse.avg ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
          </BaseCard>
        </div>
      </template>

      <EntryActions v-if="!publicView" ref="actions" />
      <BaseCard title="Readings" flush>
        <template v-if="!publicView" #actions>
          <RouterLink to="/export" class="text-sm font-medium text-slate-600 hover:text-slate-900">Export →</RouterLink>
        </template>
        <div class="mt-3">
          <EntryList
            :entries="filtered"
            :editable="!publicView"
            :show-notes="!publicView"
            @edit="(entry) => actions.edit(entry)"
           
          />
        </div>
      </BaseCard>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEntries } from '../composables/useEntries'
import {
  resolveRange, inRange, previousRange, summarize, byTimeOfDay, chartPoints, chartResolution,
  formatBP, RANGE_PRESETS,
} from '../utils/bp'
import { trendChartConfig } from '../utils/chart'
import RangePicker from '../components/RangePicker.vue'
import StatTile from '../components/StatTile.vue'
import TrendChart from '../components/TrendChart.vue'
import EntryList from '../components/EntryList.vue'
import EntryActions from '../components/EntryActions.vue'

const props = defineProps({
  // Read-only page behind the share link: no notes, no editing
  publicView: { type: Boolean, default: false },
})

const { entries, loading, loaded, error } = useEntries({ publicView: props.publicView })
const actions = ref(null)
const range = ref({ preset: '30d', from: '', to: '' })

const bounds = computed(() => resolveRange(range.value))
const filtered = computed(() => inRange(entries.value, bounds.value))
const stats = computed(() => summarize(filtered.value))
const timeOfDay = computed(() => byTimeOfDay(filtered.value))

// "-3/-1 vs previous 30 days", only for the fixed-length presets
const comparison = computed(() => {
  const preset = RANGE_PRESETS.find(p => p.id === range.value.preset)
  const previous = previousRange(bounds.value)
  if (!preset?.days || !previous || !stats.value.count) return ''
  const before = summarize(inRange(entries.value, previous))
  if (!before.count) return ''
  const signed = (value) => (value > 0 ? `+${value}` : `${value}`)
  return `${signed(stats.value.systolic.avg - before.systolic.avg)}/${signed(stats.value.diastolic.avg - before.diastolic.avg)} vs previous ${preset.label}`
})

const resolution = computed(() => chartResolution(filtered.value))
const points = computed(() => chartPoints(filtered.value, resolution.value))

const chartDescription = computed(() => ({
  reading: 'Each point is one reading',
  day: 'Daily averages, shaded band shows the lowest and highest reading of the day',
  week: 'Weekly averages, shaded band shows the lowest and highest reading of the week',
}[resolution.value]))

const chartOptions = computed(() => ({
  resolution: resolution.value,
  range: { start: bounds.value.start, end: bounds.value.end },
  showNotes: !props.publicView,
}))
const bpChart = computed(() => trendChartConfig(points.value, { ...chartOptions.value, fields: ['systolic', 'diastolic'] }))
const pulseChart = computed(() => trendChartConfig(points.value, { ...chartOptions.value, fields: ['pulse'] }))
</script>
