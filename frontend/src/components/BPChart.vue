<template>
  <div class="relative h-80 md:h-96">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { formatDate } from '../utils/bp'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

// Entries are expected newest first, as returned by the API
const props = defineProps({
  entries: { type: Array, required: true },
  showNotes: { type: Boolean, default: false },
})

const SERIES = [
  { field: 'systolic', label: 'Systolic (mmHg)', color: '239, 68, 68' },
  { field: 'diastolic', label: 'Diastolic (mmHg)', color: '245, 158, 11' },
  { field: 'pulse', label: 'Pulse (BPM)', color: '59, 130, 246' },
]

const points = computed(() =>
  props.entries
    .map(entry => ({ entry, x: new Date(entry.timestamp).getTime() }))
    .filter(point => Number.isFinite(point.x))
    .reverse()
)

const chartData = computed(() => ({
  datasets: SERIES.map(({ field, label, color }) => ({
    label,
    data: points.value.map(({ entry, x }) => ({ x, y: entry[field] })),
    borderColor: `rgb(${color})`,
    backgroundColor: `rgba(${color}, 0.1)`,
    pointBackgroundColor: `rgb(${color})`,
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointHoverRadius: 6,
  })),
}))

// Show times when every point is on the same day, dates otherwise
const singleDay = computed(() => {
  const days = new Set(points.value.map(({ x }) => new Date(x).toDateString()))
  return days.size === 1
})

const yRange = computed(() => {
  const values = points.value.flatMap(({ entry }) => SERIES.map(s => entry[s.field]))
  if (values.length === 0) return { min: 50, max: 200 }
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? { min: Math.max(0, min - 5), max: max + 5 } : { min, max }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true, padding: 15, font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        title: (items) => (items[0] ? formatDate(items[0].parsed.x) : ''),
        label: (item) => `${item.dataset.label}: ${item.parsed.y}`,
        footer: (items) => {
          const notes = props.showNotes && points.value[items[0]?.dataIndex]?.entry.notes
          return notes ? `Notes: ${notes}` : ''
        },
      },
    },
  },
  scales: {
    x: {
      type: 'linear',
      ticks: {
        maxTicksLimit: 9,
        callback: (value) => singleDay.value
          ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      },
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
    },
    y: {
      min: yRange.value.min,
      max: yRange.value.max,
      ticks: { stepSize: 10 },
    },
  },
}))
</script>
