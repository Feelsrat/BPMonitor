<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Charts & Analytics</h2>
    
    <!-- Date Range Filters -->
    <BaseCard padding="p-4" class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Time Range</h3>
      <div class="flex flex-wrap gap-2 mb-3">
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
      
      <!-- Custom Date Range Picker -->
      <div v-if="selectedFilter === 'custom'" class="mt-3 p-3 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BaseInput
            v-model="customStartDate"
            type="date"
            label="Start Date"
          />
          <BaseInput
            v-model="customEndDate"
            type="date"
            label="End Date"
          />
        </div>
      </div>
      
      <h3 class="text-sm font-semibold text-gray-700 mb-3 mt-4">Filter by Category</h3>
      <div class="flex flex-wrap gap-2 mb-3">
        <BaseButton
          v-for="cat in categories"
          :key="cat.value"
          variant="filter"
          :active="selectedCategory === cat.value"
          @click="selectedCategory = cat.value"
        >
          {{ cat.label }}
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
        {{ loading ? 'Loading...' : '🔄 Refresh' }}
      </BaseButton>
      <BaseButton
        variant="success"
        :disabled="filteredEntries.length === 0"
        @click="handleExportCSV"
        full-width
      >
        📥 Export CSV ({{ filteredEntries.length }})
      </BaseButton>
    </div>
    
    <BaseAlert v-if="filteredEntries.length === 0" type="warning">
      No blood pressure entries in this time range. {{ entries.length > 0 ? 'Try selecting a different time range.' : 'Log some entries to see charts.' }}
    </BaseAlert>
    
    <div v-else class="space-y-6">
      <!-- Chart -->
      <BaseCard>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Blood Pressure Trends</h3>
        <div class="relative h-80 md:h-96">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2 text-sm md:text-base">
          <div class="text-center">
            <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span class="text-gray-600">Normal (&lt;120/&lt;80)</span>
          </div>
          <div class="text-center">
            <span class="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <span class="text-gray-600">Elevated (120-139/80-89)</span>
          </div>
          <div class="text-center">
            <span class="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span class="text-gray-600">High (≥140/≥90)</span>
          </div>
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
      
      <!-- Table (scrollable on mobile) -->
      <BaseCard padding="p-6" class="overflow-x-auto">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Recent Entries</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 px-2">Timestamp</th>
              <th class="text-right py-2 px-2">Sys/Dia</th>
              <th class="text-right py-2 px-2">Pulse</th>
              <th class="text-left py-2 px-2">Category</th>
              <th class="text-left py-2 px-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredEntries.slice(0, 20)" :key="entry.id" class="border-b hover:bg-gray-50">
              <td class="py-2 px-2">{{ formatDate(entry.timestamp) }}</td>
              <td class="text-right py-2 px-2">{{ entry.systolic }}/{{ entry.diastolic }}</td>
              <td class="text-right py-2 px-2">{{ entry.pulse }}</td>
              <td class="py-2 px-2">
                <span v-if="entry.category" class="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                  {{ entry.category }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="py-2 px-2 text-gray-600">{{ entry.notes ? entry.notes.substring(0, 30) + (entry.notes.length > 30 ? '...' : '') : '-' }}</td>
            </tr>
          </tbody>
        </table>
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
import { getEntries, exportCSV } from '../services/api'

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
const selectedCategory = ref('all') // Filter by category
const customStartDate = ref('')
const customEndDate = ref('')

const dateFilters = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Range', value: 'custom' },
]

const categories = [
  { label: 'All Categories', value: 'all' },
  { label: '🏠 Home', value: '🏠 Home' },
  { label: '🏥 Doctor', value: '🏥 Doctor' },
  { label: '💊 Medication', value: '💊 Medication' },
  { label: '🏃 Exercise', value: '🏃 Exercise' },
  { label: '💼 Work', value: '💼 Work' },
  { label: '🌙 Sleep', value: '🌙 Sleep' },
  { label: '🍽️ Meal', value: '🍽️ Meal' },
]

const filteredEntries = computed(() => {
  let filtered = entries.value
  
  // Filter by date range
  if (selectedFilter.value === 'custom') {
    if (customStartDate.value && customEndDate.value) {
      const start = new Date(customStartDate.value)
      const end = new Date(customEndDate.value)
      end.setHours(23, 59, 59, 999) // Include the entire end day
      filtered = filtered.filter(e => {
        const entryDate = new Date(e.timestamp)
        return entryDate >= start && entryDate <= end
      })
    }
  } else if (selectedFilter.value !== 'all') {
    const now = new Date()
    const daysAgo = new Date(now.getTime() - selectedFilter.value * 24 * 60 * 60 * 1000)
    filtered = filtered.filter(e => new Date(e.timestamp) >= daysAgo)
  }
  
  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(e => e.category === selectedCategory.value)
  }
  
  return filtered
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

const chartData = computed(() => {
  // Sort entries by timestamp (oldest first) for chart
  const sorted = [...filteredEntries.value].reverse()
  
  return {
    labels: sorted.map(e => formatDate(e.timestamp)),
    datasets: [
      {
        label: 'Systolic (mmHg)',
        data: sorted.map(e => e.systolic),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#ef4444',
      },
      {
        label: 'Diastolic (mmHg)',
        data: sorted.map(e => e.diastolic),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#f59e0b',
      },
      {
        label: 'Pulse (BPM)',
        data: sorted.map(e => e.pulse),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#3b82f6',
      },
    ],
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          footer: (context) => {
            const index = context[0].dataIndex
            const sorted = [...filteredEntries.value].reverse()
            const entry = sorted[index]
            return entry?.notes ? `Notes: ${entry.notes}` : ''
          },
        },
      },
      filler: {
        propagate: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 50,
        max: 200,
        plugins: {
          filler: {
            propagate: true,
          },
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
    // Generate CSV from filtered entries
    const csvHeaders = 'Systolic,Diastolic,Pulse,Category,Notes,Timestamp\n'
    const csvRows = filteredEntries.value.map(entry => {
      const category = entry.category ? `"${entry.category.replace(/"/g, '""')}"` : ''
      const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : ''
      return `${entry.systolic},${entry.diastolic},${entry.pulse},${category},${notes},${entry.timestamp}`
    }).join('\n')
    
    const csvContent = csvHeaders + csvRows
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Include filter info in filename
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
