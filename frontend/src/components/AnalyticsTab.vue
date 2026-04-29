<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Enhanced Analytics</h2>
    
    <div class="flex flex-wrap gap-3 mb-6">
      <BaseButton
        variant="primary"
        :loading="loading"
        @click="loadEntries"
      >
        {{ loading ? 'Loading...' : 'Refresh Data' }}
      </BaseButton>
      
      <BaseButton
        variant="success"
        @click="exportPDF"
        :disabled="entries.length === 0"
      >
        Export PDF Report
      </BaseButton>
    </div>
    
    <div v-if="entries.length === 0" class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
      No data available. Log some blood pressure entries to see analytics.
    </div>
    
    <div v-else class="space-y-6">
      <!-- Time of Day Analysis -->
      <BaseCard>
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4">Average by Time of Day</h3>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div v-for="period in stats.timeOfDay" :key="period.label" class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-bold text-gray-800">{{ period.avgSystolic }}/{{ period.avgDiastolic }}</div>
            <div class="text-sm text-gray-600">{{ period.label }}</div>
            <div class="text-xs text-gray-500">{{ period.count }} readings</div>
          </div>
        </div>
      </BaseCard>
      
      <!-- Day of Week Analysis -->
      <BaseCard>
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4">Average by Day of Week</h3>
        <div class="grid grid-cols-3 sm:grid-cols-7 gap-2">
          <div v-for="day in stats.dayOfWeek" :key="day.label" class="text-center p-2 bg-gray-50 rounded-lg">
            <div class="text-xs font-semibold text-gray-600 mb-1">{{ day.label }}</div>
            <div class="text-sm font-bold text-gray-800">{{ day.avgSystolic }}</div>
            <div class="text-xs text-gray-500">{{ day.avgDiastolic }}</div>
            <div class="text-[10px] sm:text-xs text-gray-400 mt-1">{{ day.count }}</div>
          </div>
        </div>
      </BaseCard>
      
      <!-- Trends (Last 30 vs 30-60 days ago) -->
      <BaseCard>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Trend Comparisons</h3>
        
        <!-- 30-Day Comparison -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-600 mb-3">30-Day Period Comparison</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-700">{{ stats.trends.last30.avgSystolic }}/{{ stats.trends.last30.avgDiastolic }}</div>
              <div class="text-sm text-blue-600">Last 30 Days</div>
              <div class="text-xs text-gray-500">{{ stats.trends.last30.count }} readings</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-700">{{ stats.trends.prev30.avgSystolic }}/{{ stats.trends.prev30.avgDiastolic }}</div>
              <div class="text-sm text-purple-600">30-60 Days Ago</div>
              <div class="text-xs text-gray-500">{{ stats.trends.prev30.count }} readings</div>
            </div>
            <div class="text-center p-4 rounded-lg" :class="trendClass">
              <div class="text-2xl font-bold">{{ stats.trends.change.systolic > 0 ? '+' : '' }}{{ stats.trends.change.systolic }}</div>
              <div class="text-sm">Trend</div>
              <div class="text-xs">{{ stats.trends.change.direction }}</div>
            </div>
          </div>
        </div>
        
        <!-- This Month vs Last Month -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-600 mb-3">This Month vs Last Month</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-700">{{ stats.monthly.thisMonth.avgSystolic }}/{{ stats.monthly.thisMonth.avgDiastolic }}</div>
              <div class="text-sm text-green-600">This Month</div>
              <div class="text-xs text-gray-500">{{ stats.monthly.thisMonth.count }} readings</div>
            </div>
            <div class="text-center p-4 bg-teal-50 rounded-lg">
              <div class="text-2xl font-bold text-teal-700">{{ stats.monthly.lastMonth.avgSystolic }}/{{ stats.monthly.lastMonth.avgDiastolic }}</div>
              <div class="text-sm text-teal-600">Last Month</div>
              <div class="text-xs text-gray-500">{{ stats.monthly.lastMonth.count }} readings</div>
            </div>
            <div class="text-center p-4 rounded-lg" :class="monthlyTrendClass">
              <div class="text-2xl font-bold">{{ stats.monthly.change.systolic > 0 ? '+' : '' }}{{ stats.monthly.change.systolic }}</div>
              <div class="text-sm">Change</div>
              <div class="text-xs">{{ stats.monthly.change.direction }}</div>
            </div>
          </div>
        </div>
        
        <!-- Yearly Summary -->
        <div>
          <h4 class="text-sm font-semibold text-gray-600 mb-3">Year Overview</h4>
          <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div v-for="month in stats.yearlyByMonth" :key="month.label" class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-xs font-semibold text-gray-600 mb-1">{{ month.label }}</div>
              <div class="text-sm font-bold text-gray-800">{{ month.avgSystolic }}</div>
              <div class="text-xs text-gray-500">{{ month.avgDiastolic }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ month.count }}</div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEntries } from '../services/api'
import { generateBPReport } from '../utils/pdfGenerator'

const entries = ref([])
const loading = ref(false)

const loadEntries = async () => {
  loading.value = true
  try {
    const response = await getEntries()
    entries.value = response.data.results || response.data
  } catch (err) {
    console.error('Failed to load entries:', err)
  } finally {
    loading.value = false
  }
}

const stats = computed(() => {
  if (entries.value.length === 0) {
    return {
      timeOfDay: [],
      dayOfWeek: [],
      trends: {
        last30: { avgSystolic: 0, avgDiastolic: 0, count: 0 },
        prev30: { avgSystolic: 0, avgDiastolic: 0, count: 0 },
        change: { systolic: 0, diastolic: 0, direction: '' },
      },
      monthly: {
        thisMonth: { avgSystolic: 0, avgDiastolic: 0, count: 0 },
        lastMonth: { avgSystolic: 0, avgDiastolic: 0, count: 0 },
        change: { systolic: 0, diastolic: 0, direction: '' },
      },
      yearlyByMonth: [],
    }
  }
  
  // Time of Day
  const timeSlots = {
    morning: { label: 'Morning (6-12)', entries: [], avgSystolic: 0, avgDiastolic: 0, count: 0 },
    afternoon: { label: 'Afternoon (12-18)', entries: [], avgSystolic: 0, avgDiastolic: 0, count: 0 },
    evening: { label: 'Evening (18-22)', entries: [], avgSystolic: 0, avgDiastolic: 0, count: 0 },
    night: { label: 'Night (22-6)', entries: [], avgSystolic: 0, avgDiastolic: 0, count: 0 },
  }
  
  entries.value.forEach(e => {
    const hour = new Date(e.timestamp).getHours()
    if (hour >= 6 && hour < 12) timeSlots.morning.entries.push(e)
    else if (hour >= 12 && hour < 18) timeSlots.afternoon.entries.push(e)
    else if (hour >= 18 && hour < 22) timeSlots.evening.entries.push(e)
    else timeSlots.night.entries.push(e)
  })
  
  const timeOfDay = Object.values(timeSlots).map(slot => {
    if (slot.entries.length > 0) {
      slot.avgSystolic = Math.round(slot.entries.reduce((sum, e) => sum + e.systolic, 0) / slot.entries.length)
      slot.avgDiastolic = Math.round(slot.entries.reduce((sum, e) => sum + e.diastolic, 0) / slot.entries.length)
      slot.count = slot.entries.length
    }
    delete slot.entries
    return slot
  })
  
  // Day of Week
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayData = days.map((label, index) => ({
    label,
    entries: entries.value.filter(e => new Date(e.timestamp).getDay() === index),
    avgSystolic: 0,
    avgDiastolic: 0,
    count: 0,
  }))
  
  dayData.forEach(day => {
    if (day.entries.length > 0) {
      day.avgSystolic = Math.round(day.entries.reduce((sum, e) => sum + e.systolic, 0) / day.entries.length)
      day.avgDiastolic = Math.round(day.entries.reduce((sum, e) => sum + e.diastolic, 0) / day.entries.length)
      day.count = day.entries.length
    }
    delete day.entries
  })
  
  // Trends
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  
  const last30 = entries.value.filter(e => new Date(e.timestamp) >= thirtyDaysAgo)
  const prev30 = entries.value.filter(e => {
    const date = new Date(e.timestamp)
    return date < thirtyDaysAgo && date >= sixtyDaysAgo
  })
  
  const trends = {
    last30: {
      avgSystolic: last30.length > 0 ? Math.round(last30.reduce((sum, e) => sum + e.systolic, 0) / last30.length) : 0,
      avgDiastolic: last30.length > 0 ? Math.round(last30.reduce((sum, e) => sum + e.diastolic, 0) / last30.length) : 0,
      count: last30.length,
    },
    prev30: {
      avgSystolic: prev30.length > 0 ? Math.round(prev30.reduce((sum, e) => sum + e.systolic, 0) / prev30.length) : 0,
      avgDiastolic: prev30.length > 0 ? Math.round(prev30.reduce((sum, e) => sum + e.diastolic, 0) / prev30.length) : 0,
      count: prev30.length,
    },
    change: { systolic: 0, diastolic: 0, direction: '' },
  }
  
  trends.change.systolic = trends.last30.avgSystolic - trends.prev30.avgSystolic
  trends.change.diastolic = trends.last30.avgDiastolic - trends.prev30.avgDiastolic
  
  if (trends.change.systolic > 0) trends.change.direction = 'Increasing'
  else if (trends.change.systolic < 0) trends.change.direction = 'Decreasing'
  else trends.change.direction = 'Stable'
  
  // Monthly comparison (this month vs last month)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  
  const thisMonthEntries = entries.value.filter(e => new Date(e.timestamp) >= thisMonthStart)
  const lastMonthEntries = entries.value.filter(e => {
    const date = new Date(e.timestamp)
    return date >= lastMonthStart && date <= lastMonthEnd
  })
  
  const monthly = {
    thisMonth: {
      avgSystolic: thisMonthEntries.length > 0 ? Math.round(thisMonthEntries.reduce((sum, e) => sum + e.systolic, 0) / thisMonthEntries.length) : 0,
      avgDiastolic: thisMonthEntries.length > 0 ? Math.round(thisMonthEntries.reduce((sum, e) => sum + e.diastolic, 0) / thisMonthEntries.length) : 0,
      count: thisMonthEntries.length,
    },
    lastMonth: {
      avgSystolic: lastMonthEntries.length > 0 ? Math.round(lastMonthEntries.reduce((sum, e) => sum + e.systolic, 0) / lastMonthEntries.length) : 0,
      avgDiastolic: lastMonthEntries.length > 0 ? Math.round(lastMonthEntries.reduce((sum, e) => sum + e.diastolic, 0) / lastMonthEntries.length) : 0,
      count: lastMonthEntries.length,
    },
    change: { systolic: 0, diastolic: 0, direction: '' },
  }
  
  monthly.change.systolic = monthly.thisMonth.avgSystolic - monthly.lastMonth.avgSystolic
  monthly.change.diastolic = monthly.thisMonth.avgDiastolic - monthly.lastMonth.avgDiastolic
  
  if (monthly.change.systolic > 0) monthly.change.direction = 'Increasing'
  else if (monthly.change.systolic < 0) monthly.change.direction = 'Decreasing'
  else monthly.change.direction = 'Stable'
  
  // Yearly by month (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const yearlyByMonth = []
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const monthEntries = entries.value.filter(e => {
      const date = new Date(e.timestamp)
      return date >= monthDate && date <= monthEnd
    })
    
    yearlyByMonth.push({
      label: monthNames[monthDate.getMonth()],
      avgSystolic: monthEntries.length > 0 ? Math.round(monthEntries.reduce((sum, e) => sum + e.systolic, 0) / monthEntries.length) : 0,
      avgDiastolic: monthEntries.length > 0 ? Math.round(monthEntries.reduce((sum, e) => sum + e.diastolic, 0) / monthEntries.length) : 0,
      count: monthEntries.length,
    })
  }
  
  return {
    timeOfDay,
    dayOfWeek: dayData,
    trends,
    monthly,
    yearlyByMonth,
  }
})

const trendClass = computed(() => {
  const change = stats.value.trends.change.systolic
  if (change < -5) return 'bg-green-50 text-green-700'
  if (change > 5) return 'bg-red-50 text-red-700'
  return 'bg-gray-50 text-gray-700'
})

const monthlyTrendClass = computed(() => {
  const change = stats.value.monthly.change.systolic
  if (change < -5) return 'bg-green-50 text-green-700'
  if (change > 5) return 'bg-red-50 text-red-700'
  return 'bg-gray-50 text-gray-700'
})

const exportPDF = () => {
  // Calculate basic stats for the PDF
  const avgSystolic = entries.value.length > 0 
    ? Math.round(entries.value.reduce((sum, e) => sum + e.systolic, 0) / entries.value.length)
    : 0
  const avgDiastolic = entries.value.length > 0
    ? Math.round(entries.value.reduce((sum, e) => sum + e.diastolic, 0) / entries.value.length)
    : 0
  const avgPulse = entries.value.length > 0
    ? Math.round(entries.value.reduce((sum, e) => sum + e.pulse, 0) / entries.value.length)
    : 0
  
  const systolicValues = entries.value.map(e => e.systolic)
  const diastolicValues = entries.value.map(e => e.diastolic)
  const pulseValues = entries.value.map(e => e.pulse)
  
  generateBPReport({
    entries: entries.value,
    stats: {
      avgSystolic,
      avgDiastolic,
      avgPulse,
      minSystolic: Math.min(...systolicValues),
      maxSystolic: Math.max(...systolicValues),
      minDiastolic: Math.min(...diastolicValues),
      maxDiastolic: Math.max(...diastolicValues),
      minPulse: Math.min(...pulseValues),
      maxPulse: Math.max(...pulseValues),
      ...stats.value,
    },
    dateRange: 'All Time',
  })
}

onMounted(() => {
  loadEntries()
})
</script>
