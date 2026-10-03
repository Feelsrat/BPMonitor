<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Analytics</h2>

    <div class="flex flex-wrap gap-3 mb-6">
      <BaseButton variant="primary" :loading="loading" @click="loadEntries">
        {{ loading ? 'Loading...' : 'Refresh Data' }}
      </BaseButton>
      <BaseButton variant="success" :disabled="entries.length === 0" @click="exportPDF">
        Export PDF Report
      </BaseButton>
    </div>

    <BaseAlert v-if="errorMessage" type="error" class="mb-6">
      {{ errorMessage }}
    </BaseAlert>

    <BaseAlert v-if="entries.length === 0" type="warning">
      No data available. Log some blood pressure entries to see analytics.
    </BaseAlert>

    <div v-else class="space-y-6">
      <BaseCard>
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4">Average by Time of Day</h3>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div v-for="slot in stats.timeOfDay" :key="slot.label" class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-bold text-gray-800">{{ slot.avgSystolic }}/{{ slot.avgDiastolic }}</div>
            <div class="text-sm text-gray-600">{{ slot.label }}</div>
            <div class="text-xs text-gray-500">{{ slot.count }} readings</div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4">Average by Day of Week</h3>
        <div class="grid grid-cols-3 sm:grid-cols-7 gap-2">
          <div v-for="day in stats.dayOfWeek" :key="day.label" class="text-center p-2 bg-gray-50 rounded-lg">
            <div class="text-xs font-semibold text-gray-600 mb-1">{{ day.label }}</div>
            <div class="text-sm font-bold text-gray-800">{{ day.avgSystolic }}/{{ day.avgDiastolic }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ day.count }} readings</div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Trend Comparisons</h3>

        <div v-for="comparison in comparisons" :key="comparison.title" class="mb-6">
          <h4 class="text-sm font-semibold text-gray-600 mb-3">{{ comparison.title }}</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-700">{{ comparison.current.avgSystolic }}/{{ comparison.current.avgDiastolic }}</div>
              <div class="text-sm text-blue-600">{{ comparison.currentLabel }}</div>
              <div class="text-xs text-gray-500">{{ comparison.current.count }} readings</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-700">{{ comparison.previous.avgSystolic }}/{{ comparison.previous.avgDiastolic }}</div>
              <div class="text-sm text-purple-600">{{ comparison.previousLabel }}</div>
              <div class="text-xs text-gray-500">{{ comparison.previous.count }} readings</div>
            </div>
            <div class="text-center p-4 rounded-lg" :class="changeClass(comparison)">
              <div class="text-2xl font-bold">{{ formatChange(comparison) }}</div>
              <div class="text-sm">Systolic change</div>
            </div>
          </div>
        </div>

        <h4 class="text-sm font-semibold text-gray-600 mb-3">Last 6 Months</h4>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div v-for="month in stats.lastSixMonths" :key="month.label" class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-xs font-semibold text-gray-600 mb-1">{{ month.label }}</div>
            <div class="text-sm font-bold text-gray-800">{{ month.avgSystolic }}/{{ month.avgDiastolic }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ month.count }} readings</div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEntries, errorMessage as apiError } from '../services/api'
import { computeAnalytics } from '../utils/bp'

const entries = ref([])
const loading = ref(false)
const errorMessage = ref('')

const stats = computed(() => computeAnalytics(entries.value))

const comparisons = computed(() => [
  { title: '30-Day Period Comparison', currentLabel: 'Last 30 Days', previousLabel: '30-60 Days Ago', ...stats.value.last30 },
  { title: 'This Month vs Last Month', currentLabel: 'This Month', previousLabel: 'Last Month', ...stats.value.monthly },
])

// A change is only meaningful when both periods have readings
const hasChange = ({ current, previous }) => current.count > 0 && previous.count > 0

const formatChange = (comparison) => {
  if (!hasChange(comparison)) return '-'
  const value = comparison.change.systolic
  return value > 0 ? `+${value}` : String(value)
}

const changeClass = (comparison) => {
  const value = hasChange(comparison) ? comparison.change.systolic : 0
  if (value < -5) return 'bg-green-50 text-green-700'
  if (value > 5) return 'bg-red-50 text-red-700'
  return 'bg-gray-50 text-gray-700'
}

const loadEntries = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    entries.value = (await getEntries()).data
  } catch (err) {
    errorMessage.value = apiError(err, 'Failed to load entries. Please try again.')
  } finally {
    loading.value = false
  }
}

const exportPDF = async () => {
  const { generateBPReport } = await import('../utils/pdfGenerator')
  generateBPReport({ entries: entries.value, dateRange: 'All Time', analytics: stats.value })
}

onMounted(loadEntries)
</script>
