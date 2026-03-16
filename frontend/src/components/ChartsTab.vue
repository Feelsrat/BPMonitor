<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Charts & Analytics</h2>
    
    <!-- Date Range Filters -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Time Range</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="filter in dateFilters"
          :key="filter.value"
          @click="selectedFilter = filter.value"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition',
            selectedFilter === filter.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Showing {{ filteredEntries.length }} of {{ entries.length }} entries
      </p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-2 mb-6">
      <button
        @click="loadEntries"
        :disabled="loading"
        class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
      >
        {{ loading ? 'Loading...' : '🔄 Refresh' }}
      </button>
      <button
        @click="handleExportCSV"
        :disabled="entries.length === 0"
        class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
      >
        📥 Export CSV
      </button>
    </div>
    
    <div v-if="filteredEntries.length === 0" class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
      No blood pressure entries in this time range. {{ entries.length > 0 ? 'Try selecting a different time range.' : 'Log some entries to see charts.' }}
    </div>
    
    <div v-else class="space-y-6">
      <!-- Chart -->
      <div class="bg-white rounded-lg shadow-md p-6">
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
      </div>
      
      <!-- Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-md p-6">
          <p class="text-gray-600 text-sm mb-2">Latest Systolic</p>
          <p class="text-3xl font-bold text-gray-800">{{ lastEntry?.systolic }}</p>
          <p class="text-xs text-gray-500 mt-2">{{ formatDate(lastEntry?.timestamp) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <p class="text-gray-600 text-sm mb-2">Avg Systolic (7 days)</p>
          <p class="text-3xl font-bold text-gray-800">{{ avgSystolic7d }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <p class="text-gray-600 text-sm mb-2">Avg Diastolic (7 days)</p>
          <p class="text-3xl font-bold text-gray-800">{{ avgDiastolic7d }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <p class="text-gray-600 text-sm mb-2">Total Entries</p>
          <p class="text-3xl font-bold text-gray-800">{{ entries.length }}</p>
        </div>
      </div>
      
      <!-- Table (scrollable on mobile) -->
      <div class="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Recent Entries</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 px-2">Timestamp</th>
              <th class="text-right py-2 px-2">Sys/Dia</th>
              <th class="text-right py-2 px-2">Pulse</th>
              <th class="text-left py-2 px-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredEntries.slice(0, 20)" :key="entry.id" class="border-b hover:bg-gray-50">
              <td class="py-2 px-2">{{ formatDate(entry.timestamp) }}</td>
              <td class="text-right py-2 px-2">{{ entry.systolic }}/{{ entry.diastolic }}</td>
              <td class="text-right py-2 px-2">{{ entry.pulse }}</td>
              <td class="py-2 px-2 text-gray-600">{{ entry.notes ? entry.notes.substring(0, 30) + (entry.notes.length > 30 ? '...' : '') : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="errorMessage" class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
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

export default {
  name: 'ChartsTab',
  components: {
    Line,
  },
  setup() {
    const entries = ref([])
    const loading = ref(false)
    const errorMessage = ref('')
    const selectedFilter = ref('all')
    
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
        const response = await exportCSV()
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `bp_export_${new Date().toISOString().split('T')[0]}.csv`)
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
    
    return {
      entries,
      loading,
      errorMessage,
      selectedFilter,
      dateFilters,
      filteredEntries,
      lastEntry,
      avgSystolic7d,
      avgDiastolic7d,
      chartData,
      chartOptions,
      formatDate,
      loadEntries,
      handleExportCSV,
    }
  },
}
</script>
