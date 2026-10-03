<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <div v-if="publicView" class="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Public Blood Pressure Data</h2>
      <p class="text-xs sm:text-sm text-gray-600">This is a read-only view. Notes are not shown.</p>
    </div>
    <h2 v-else class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Charts</h2>

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

      <div v-if="selectedFilter === 'custom'" class="mt-3 p-3 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
        <BaseInput v-model="customStartDate" type="date" label="Start Date" />
        <BaseInput v-model="customEndDate" type="date" label="End Date" />
      </div>

      <p class="text-sm text-gray-600 mt-3">
        Showing {{ filteredEntries.length }} of {{ entries.length }} entries
      </p>
    </BaseCard>

    <div class="flex flex-col sm:flex-row gap-2 mb-6">
      <BaseButton variant="primary" :loading="loading" @click="loadEntries" full-width>
        {{ loading ? 'Loading...' : 'Refresh' }}
      </BaseButton>
      <BaseButton variant="success" :disabled="filteredEntries.length === 0" @click="exportCSV" full-width>
        Export CSV ({{ filteredEntries.length }})
      </BaseButton>
      <BaseButton v-if="!publicView" variant="success" :disabled="filteredEntries.length === 0" @click="exportPDF" full-width>
        Export PDF
      </BaseButton>
    </div>

    <BaseAlert v-if="errorMessage" type="error" class="mb-6">
      {{ errorMessage }}
    </BaseAlert>

    <BaseAlert v-if="filteredEntries.length === 0" type="warning">
      No blood pressure entries in this time range.
      {{ entries.length > 0 ? 'Try selecting a different time range.' : '' }}
    </BaseAlert>

    <div v-else class="space-y-6">
      <BaseCard>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Blood Pressure Trends</h3>
        <BPChart :entries="filteredEntries" :show-notes="!publicView" />
      </BaseCard>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseStatCard
          label="Latest Reading"
          :value="latest && `${latest.systolic}/${latest.diastolic}`"
          :subtitle="formatDate(latest?.timestamp)"
        />
        <BaseStatCard label="Avg Systolic (7 days)" :value="lastWeek.avgSystolic || '-'" />
        <BaseStatCard label="Avg Diastolic (7 days)" :value="lastWeek.avgDiastolic || '-'" />
        <BaseStatCard label="Total Entries" :value="entries.length" />
      </div>

      <BaseCard padding="p-4">
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4">Recent Entries</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs sm:text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2 px-2">Timestamp</th>
                <th class="text-right py-2 px-2">Sys/Dia</th>
                <th class="text-right py-2 px-2">Pulse</th>
                <th v-if="!publicView" class="text-left py-2 px-2">Notes</th>
                <th v-if="!publicView" class="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredEntries.slice(0, 20)" :key="entry.id" class="border-b hover:bg-gray-50">
                <td class="py-2 px-2 whitespace-nowrap">{{ formatDate(entry.timestamp) }}</td>
                <td class="text-right py-2 px-2">{{ entry.systolic }}/{{ entry.diastolic }}</td>
                <td class="text-right py-2 px-2">{{ entry.pulse }}</td>
                <template v-if="!publicView">
                  <td class="py-2 px-2 max-w-[200px] truncate">{{ entry.notes || '-' }}</td>
                  <td class="py-2 px-2 text-right">
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-800 text-xs font-semibold"
                      @click="removeEntry(entry)"
                    >
                      Delete
                    </button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEntries, getPublicEntries, deleteEntry, errorMessage as apiError } from '../services/api'
import { entriesSince, entriesBetween, summarize, formatDate, downloadCSV } from '../utils/bp'
import BPChart from './BPChart.vue'

const props = defineProps({
  // Read-only mode for the shareable /public page: no notes, editing or PDF export
  publicView: { type: Boolean, default: false },
})

const entries = ref([])
const loading = ref(false)
const errorMessage = ref('')
const selectedFilter = ref(7)
const customStartDate = ref('')
const customEndDate = ref('')

const dateFilters = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Range', value: 'custom' },
]

const filterLabel = computed(() => {
  if (selectedFilter.value === 'custom' && customStartDate.value && customEndDate.value) {
    return `${customStartDate.value} to ${customEndDate.value}`
  }
  return dateFilters.find(f => f.value === selectedFilter.value).label
})

const filteredEntries = computed(() => {
  if (selectedFilter.value === 'all') return entries.value
  if (selectedFilter.value === 'custom') {
    if (!customStartDate.value || !customEndDate.value) return entries.value
    const start = new Date(`${customStartDate.value}T00:00:00`)
    const end = new Date(`${customEndDate.value}T23:59:59.999`)
    return entriesBetween(entries.value, start, end)
  }
  return entriesSince(entries.value, selectedFilter.value)
})

const latest = computed(() => filteredEntries.value[0])
const lastWeek = computed(() => summarize(entriesSince(entries.value, 7)))

const loadEntries = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await (props.publicView ? getPublicEntries() : getEntries())
    entries.value = response.data
  } catch (err) {
    errorMessage.value = apiError(err, 'Failed to load entries. Please try again.')
  } finally {
    loading.value = false
  }
}

const removeEntry = async (entry) => {
  if (!confirm(`Delete the ${entry.systolic}/${entry.diastolic} reading from ${formatDate(entry.timestamp)}?`)) return
  try {
    await deleteEntry(entry.id)
    entries.value = entries.value.filter(e => e.id !== entry.id)
  } catch (err) {
    errorMessage.value = apiError(err, 'Failed to delete entry.')
  }
}

const exportCSV = () => {
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(filteredEntries.value, `bp_export_${filterLabel.value.replace(/\s+/g, '_')}_${date}.csv`, {
    includeNotes: !props.publicView,
  })
}

const exportPDF = async () => {
  // Loaded on demand: the PDF libraries are large
  const { generateBPReport } = await import('../utils/pdfGenerator')
  generateBPReport({ entries: filteredEntries.value, dateRange: filterLabel.value })
}

onMounted(loadEntries)
</script>
