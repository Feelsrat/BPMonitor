export const DAY_MS = 24 * 60 * 60 * 1000

export const timeOf = (entry) => new Date(entry.timestamp).getTime()

const round = (value) => Math.round(value)

export function fieldStats(entries, field) {
  if (entries.length === 0) return { avg: null, min: null, max: null }
  let sum = 0
  let min = Infinity
  let max = -Infinity
  for (const entry of entries) {
    const value = entry[field]
    sum += value
    if (value < min) min = value
    if (value > max) max = value
  }
  return { avg: round(sum / entries.length), min, max }
}

const dayKey = (time) => new Date(time).toDateString()

export function summarize(entries) {
  return {
    count: entries.length,
    days: new Set(entries.map(e => dayKey(timeOf(e)))).size,
    systolic: fieldStats(entries, 'systolic'),
    diastolic: fieldStats(entries, 'diastolic'),
    pulse: fieldStats(entries, 'pulse'),
  }
}

// ---- Date ranges ----------------------------------------------------------

export const RANGE_PRESETS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '1y', label: '1 year', days: 365 },
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom' },
]

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

// Resolves a range selection to { start, end } timestamps; start is null for "All"
export function resolveRange({ preset, from, to }, now = new Date()) {
  if (preset === 'custom' && from && to) {
    return {
      start: new Date(`${from}T00:00:00`).getTime(),
      end: new Date(`${to}T23:59:59.999`).getTime(),
    }
  }
  const days = RANGE_PRESETS.find(p => p.id === preset)?.days
  if (!days) return { start: null, end: now.getTime() }
  // Whole calendar days, including today
  return { start: startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS)).getTime(), end: now.getTime() }
}

export const inRange = (entries, { start, end }) =>
  entries.filter(e => {
    const time = timeOf(e)
    return (start === null || time >= start) && time <= end
  })

// The window of the same length just before the given range
export function previousRange({ start, end }) {
  if (start === null) return null
  return { start: start - (end - start), end: start - 1 }
}

// ---- Groupings ------------------------------------------------------------

export const TIME_SLOTS = [
  { label: 'Morning', hours: '06:00-12:00', from: 6, to: 12 },
  { label: 'Afternoon', hours: '12:00-18:00', from: 12, to: 18 },
  { label: 'Evening', hours: '18:00-22:00', from: 18, to: 22 },
  { label: 'Night', hours: '22:00-06:00', from: 22, to: 30 },
]

export function byTimeOfDay(entries) {
  return TIME_SLOTS.map(slot => ({
    ...slot,
    ...summarize(entries.filter(e => {
      const hour = new Date(e.timestamp).getHours()
      return (hour >= slot.from && hour < slot.to) || hour + 24 < slot.to
    })),
  }))
}

// Monthly summaries, newest month first
export function byMonth(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const date = new Date(entry.timestamp)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, { key, date: new Date(date.getFullYear(), date.getMonth(), 1), entries: [] })
    groups.get(key).entries.push(entry)
  }
  return [...groups.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .map(({ key, date, entries }) => ({ key, date, ...summarize(entries) }))
}

// Readings grouped per calendar day, newest first (entries must be newest first)
export function byDay(entries) {
  const days = []
  for (const entry of entries) {
    const key = dayKey(timeOf(entry))
    if (days.at(-1)?.key !== key) days.push({ key, date: new Date(entry.timestamp), entries: [] })
    days.at(-1).entries.push(entry)
  }
  return days
}

// ---- Chart series -----------------------------------------------------------

const bucketStart = {
  day: (date) => startOfDay(date),
  // Weeks start on Monday
  week: (date) => startOfDay(new Date(date.getTime() - ((date.getDay() + 6) % 7) * DAY_MS)),
}

// Pick the chart resolution from the time span: raw readings for short ranges,
// daily or weekly averages for longer ones so the chart stays readable.
export function chartResolution(entries) {
  if (entries.length < 2) return 'reading'
  const span = timeOf(entries[0]) - timeOf(entries.at(-1))
  if (span <= 45 * DAY_MS) return 'reading'
  if (span <= 400 * DAY_MS) return 'day'
  return 'week'
}

// Chart points, oldest first: { x, count, systolic: {avg,min,max}, diastolic, pulse, entry? }
export function chartPoints(entries, resolution = chartResolution(entries)) {
  const sorted = [...entries].sort((a, b) => timeOf(a) - timeOf(b))
  if (resolution === 'reading') {
    return sorted.map(entry => ({
      x: timeOf(entry),
      count: 1,
      entry,
      ...Object.fromEntries(['systolic', 'diastolic', 'pulse'].map(f =>
        [f, { avg: entry[f], min: entry[f], max: entry[f] }])),
    }))
  }

  const buckets = new Map()
  for (const entry of sorted) {
    const start = bucketStart[resolution](new Date(entry.timestamp)).getTime()
    if (!buckets.has(start)) buckets.set(start, [])
    buckets.get(start).push(entry)
  }
  const width = resolution === 'week' ? 7 * DAY_MS : DAY_MS
  return [...buckets].map(([start, group]) => {
    const stats = summarize(group)
    return { x: start + width / 2, count: group.length, ...stats }
  })
}

// ---- Formatting -------------------------------------------------------------

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(value).toLocaleDateString('en-GB', options)

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export const formatDateTime = (value) => `${formatDate(value)}, ${formatTime(value)}`

export const formatBP = (systolic, diastolic) =>
  systolic === null || systolic === undefined ? '-' : `${systolic}/${diastolic}`

// "3 Sep 2026 - 3 Oct 2026", based on the readings actually in the range
export function describeSpan(entries) {
  if (entries.length === 0) return 'No readings'
  const first = formatDate(entries.at(-1).timestamp)
  const last = formatDate(entries[0].timestamp)
  return first === last ? first : `${first} - ${last}`
}

// Value for <input type="datetime-local"> in local time
export function toLocalInput(value = new Date()) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

// ---- CSV --------------------------------------------------------------------

const csvField = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCSV(entries, filename, { includeNotes = true } = {}) {
  const columns = ['Systolic', 'Diastolic', 'Pulse', ...(includeNotes ? ['Notes'] : []), 'Timestamp']
  const rows = entries.map(e => [e.systolic, e.diastolic, e.pulse, ...(includeNotes ? [e.notes] : []), e.timestamp])
  const csv = [columns, ...rows].map(row => row.map(csvField).join(',')).join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
