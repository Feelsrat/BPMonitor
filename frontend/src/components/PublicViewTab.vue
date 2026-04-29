<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <div class="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Public Blood Pressure Data</h2>
      <p class="text-xs sm:text-sm text-gray-600">This is a read-only view. You cannot add or modify entries.</p>
    </div>
    
    <!-- Date Range Filters -->
    <BaseCard padding="p-4" class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Time Range</h3>
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-for="filter in dateFilters"
          :key="filter.value"
          variant="filter"
          :active="selectedFilter === filter.value"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </BaseButton>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Showing {{ filteredEntries.length }} of {{ entries.length }} entries
      </p>
    </BaseCard>
    
    <div class="flex flex-col sm:flex-row gap-2 mb-6">
      <BaseButton
        variant="primary"
        :loading="loading"
        :disabled="loading"
        @click="loadEntries"
        full-width
      >
        {{ loading ? 'Loading...' : 'Refresh' }}
      </BaseButton>
      <BaseButton
        variant="success"
        :disabled="filteredEntries.length === 0"
        @click="handleExportCSV"
        full-width
      >
        Export CSV ({{ filteredEntries.length }})
      </BaseButton>
    </div>
    
    <BaseAlert v-if="filteredEntries.length === 0" type="warning">
      No blood pressure entries in this time range.
    </BaseAlert>
    
    <div v-else class="space-y-6">
      <!-- Chart -->
      <BaseCard>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Blood Pressure Trends</h3>
        <div class="relative h-80 md:h-96">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </BaseCard>
      
      <!-- Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseStatCard
          label="Latest Systolic"
          :value="lastEntry?.systolic"
          :subtitle="formatDate(lastEntry?.timestamp)"
        />
        <BaseStatCard
          label="Avg Systolic (7 days)"
          :value="avgSystolic7d"
        />
        <BaseStatCard
          label="Avg Diastolic (7 days)"
          :value="avgDiastolic7d"
        />
        <BaseStatCard
          label="Total Entries"
          :value="entries.length"
        />
      </div>
      
      <!-- Table -->
      <BaseCard padding="p-4 sm:p-6">
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4">Recent Entries</h3>
        <div class="overflow-x-auto -mx-4 sm:mx-0">
          <table class="w-full text-xs sm:text-sm min-w-[500px]">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2 px-2">Timestamp</th>
                <th class="text-right py-2 px-2">Sys/Dia</th>
                <th class="text-right py-2 px-2">Pulse</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredEntries.slice(0, 20)" :key="entry.id" class="border-b hover:bg-gray-50">
                <td class="py-2 px-2">{{ formatDate(entry.timestamp) }}</td>
                <td class="text-right py-2 px-2">{{ entry.systolic }}/{{ entry.diastolic }}</td>
                <td class="text-right py-2 px-2">{{ entry.pulse }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
    
    <BaseAlert v-if="errorMessage" type="error" class="mt-4">
      {{ errorMessage }}
    </BaseAlert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { getEntries } from '../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const entries = ref([])
const loading = ref(false)
const errorMessage = ref('')
const selectedFilter = ref(7) // Default to Last 7 Days

const dateFilters = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 'all' },
]

const filteredEntries = computed(() => {
  if (selectedFilter.value === 'all') {
    return entries.value
  }
  
  const now = new Date()
  const daysAgo = new Date(now.getTime() - selectedFilter.value * 24 * 60 * 60 * 1000)
  return entries.value.filter(e => new Date(e.timestamp) >= daysAgo)
})

const lastEntry = computed(() => filteredEntries.value[0])

const avgSystolic7d = computed(() => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recent = filteredEntries.value.filter(e => new Date(e.timestamp) >= sevenDaysAgo)
  if (recent.length === 0) return '-'
  const sum = recent.reduce((acc, e) => acc + e.systolic, 0)
  return Math.round(sum / recent.length)
})

const avgDiastolic7d = computed(() => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recent = filteredEntries.value.filter(e => new Date(e.timestamp) >= sevenDaysAgo)
  if (recent.length === 0) return '-'
  const sum = recent.reduce((acc, e) => acc + e.diastolic, 0)
  return Math.round(sum / recent.length)
})

const chartEntries = computed(() => {
  return [...filteredEntries.value]
    .reverse()
    .filter(e => Number.isFinite(new Date(e.timestamp).getTime()))
})

const chartData = computed(() => {
  const sorted = chartEntries.value
  
  return {
    datasets: [
      {
        label: 'Systolic (mmHg)',
        data: sorted.map(e => ({ x: new Date(e.timestamp).getTime(), y: e.systolic })),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Diastolic (mmHg)',
        data: sorted.map(e => ({ x: new Date(e.timestamp).getTime(), y: e.diastolic })),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Pulse (BPM)',
        data: sorted.map(e => ({ x: new Date(e.timestamp).getTime(), y: e.pulse })),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const formatChartTick = (value) => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const sorted = chartEntries.value
  const firstDate = sorted[0] ? new Date(sorted[0].timestamp).toDateString() : ''
  const lastDate = sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].timestamp).toDateString() : ''
  return firstDate && firstDate === lastDate
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return context[0] ? formatDate(context[0].parsed.x) : ''
          },
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          maxTicksLimit: 9,
          callback: (value) => formatChartTick(value),
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.18)',
        },
      },
      y: {
        beginAtZero: false,
        min: 50,
        max: 200,
        ticks: {
          stepSize: 10,
        },
      },
    },
  }
})

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const loadEntries = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await getEntries()
    entries.value = response.data.results || response.data
  } catch (err) {
    errorMessage.value = 'Failed to load entries. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleExportCSV = async () => {
  try {
    const csvHeaders = 'Systolic,Diastolic,Pulse,Timestamp\n'
    const csvRows = filteredEntries.value.map(entry => {
      return `${entry.systolic},${entry.diastolic},${entry.pulse},${entry.timestamp}`
    }).join('\n')
    
    const csvContent = csvHeaders + csvRows
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const filterLabel = dateFilters.find(f => f.value === selectedFilter.value)?.label.replace(/\s+/g, '_') || 'all'
    link.setAttribute('download', `bp_export_${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`)
    
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    errorMessage.value = 'Failed to export CSV. Please try again.'
  }
}

onMounted(() => {
  loadEntries()
})
</script>
