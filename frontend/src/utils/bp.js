const DAY_MS = 24 * 60 * 60 * 1000

const time = (entry) => new Date(entry.timestamp).getTime()

export const average = (entries, field) =>
  entries.length ? Math.round(entries.reduce((sum, e) => sum + e[field], 0) / entries.length) : 0

// Average systolic/diastolic and reading count for a group of entries
export const summarize = (entries) => ({
  avgSystolic: average(entries, 'systolic'),
  avgDiastolic: average(entries, 'diastolic'),
  count: entries.length,
})

export const entriesSince = (entries, days) => {
  const cutoff = Date.now() - days * DAY_MS
  return entries.filter(e => time(e) >= cutoff)
}

export const entriesBetween = (entries, start, end) =>
  entries.filter(e => time(e) >= start.getTime() && time(e) <= end.getTime())

export const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const csvField = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCSV(entries, filename, { includeNotes = true } = {}) {
  const columns = ['Systolic', 'Diastolic', 'Pulse', ...(includeNotes ? ['Notes'] : []), 'Timestamp']
  const rows = entries.map(e => [e.systolic, e.diastolic, e.pulse, ...(includeNotes ? [e.notes] : []), e.timestamp])
  const csv = [columns, ...rows].map(row => row.map(csvField).join(',')).join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const TIME_SLOTS = [
  { label: 'Morning (6-12)', from: 6, to: 12 },
  { label: 'Afternoon (12-18)', from: 12, to: 18 },
  { label: 'Evening (18-22)', from: 18, to: 22 },
  { label: 'Night (22-6)', from: 22, to: 30 },
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const withChange = (current, previous) => ({
  current,
  previous,
  change: {
    systolic: current.avgSystolic - previous.avgSystolic,
    diastolic: current.avgDiastolic - previous.avgDiastolic,
  },
})

// Pattern and period-comparison statistics shown on the Analytics tab and in the PDF report
export function computeAnalytics(entries, now = new Date()) {
  const timeOfDay = TIME_SLOTS.map(({ label, from, to }) => ({
    label,
    ...summarize(entries.filter(e => {
      const hour = new Date(e.timestamp).getHours()
      return (hour >= from && hour < to) || hour + 24 < to
    })),
  }))

  const dayOfWeek = DAYS.map((label, day) => ({
    label,
    ...summarize(entries.filter(e => new Date(e.timestamp).getDay() === day)),
  }))

  const daysAgo = (days) => new Date(now.getTime() - days * DAY_MS)
  const monthStart = (offset) => new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const monthEntries = (offset) =>
    entriesBetween(entries, monthStart(offset), new Date(monthStart(offset + 1).getTime() - 1))

  const last30 = withChange(
    summarize(entriesBetween(entries, daysAgo(30), now)),
    summarize(entriesBetween(entries, daysAgo(60), new Date(daysAgo(30).getTime() - 1))),
  )
  const monthly = withChange(summarize(monthEntries(0)), summarize(monthEntries(-1)))

  const lastSixMonths = [-5, -4, -3, -2, -1, 0].map(offset => ({
    label: monthStart(offset).toLocaleDateString('en-US', { month: 'short' }),
    ...summarize(monthEntries(offset)),
  }))

  return { timeOfDay, dayOfWeek, last30, monthly, lastSixMonths }
}
