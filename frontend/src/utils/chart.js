import { Chart, LineController, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { DAY_MS, formatDate, formatTime } from './bp'

Chart.register(LineController, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

// Validated categorical slots (blue, orange, aqua); pulse gets its own chart, never a second axis
export const SERIES = {
  systolic: { label: 'Systolic', color: '#2a78d6', unit: 'mmHg' },
  diastolic: { label: 'Diastolic', color: '#eb6834', unit: 'mmHg' },
  pulse: { label: 'Pulse', color: '#1baf7a', unit: 'bpm' },
}

const INK = { text: '#52514e', muted: '#8a8984', grid: 'rgba(15, 23, 42, 0.07)', axis: 'rgba(15, 23, 42, 0.18)' }

const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// ---- Time axis ---------------------------------------------------------------

const HOUR = 60 * 60 * 1000
const STEPS = [
  [1, 'hour', HOUR], [3, 'hour', 3 * HOUR], [6, 'hour', 6 * HOUR], [12, 'hour', 12 * HOUR],
  [1, 'day', DAY_MS], [2, 'day', 2 * DAY_MS], [7, 'day', 7 * DAY_MS], [14, 'day', 14 * DAY_MS],
  [1, 'month', 30 * DAY_MS], [2, 'month', 61 * DAY_MS], [3, 'month', 91 * DAY_MS],
  [6, 'month', 182 * DAY_MS], [1, 'year', 365 * DAY_MS],
]

// Tick positions on calendar boundaries (midnight, Mondays, 1st of month, ...)
export function timeTicks(min, max, maxTicks = 7) {
  const [size, unit] = STEPS.find(([, , ms]) => (max - min) / ms <= maxTicks) ?? STEPS.at(-1)
  const date = new Date(min)
  date.setMinutes(0, 0, 0)
  if (unit === 'hour') date.setHours(Math.ceil(date.getHours() / size) * size)
  else {
    date.setHours(0)
    if (unit === 'day' && size === 7) date.setDate(date.getDate() + ((8 - date.getDay()) % 7))
    if (unit === 'month' || unit === 'year') date.setDate(1)
    if (unit === 'month') date.setMonth(Math.ceil(date.getMonth() / size) * size)
    if (unit === 'year') date.setMonth(0)
    if (date.getTime() < min) {
      if (unit === 'day') date.setDate(date.getDate() + (size === 7 ? 7 : 1))
      if (unit === 'month') date.setMonth(date.getMonth() + size)
      if (unit === 'year') date.setFullYear(date.getFullYear() + 1)
    }
  }

  const ticks = []
  while (date.getTime() <= max && ticks.length < 50) {
    if (date.getTime() >= min) ticks.push(date.getTime())
    if (unit === 'hour') date.setHours(date.getHours() + size)
    if (unit === 'day') date.setDate(date.getDate() + size)
    if (unit === 'month') date.setMonth(date.getMonth() + size)
    if (unit === 'year') date.setFullYear(date.getFullYear() + size)
  }
  return { ticks, unit }
}

function tickLabel(value, unit, spansYears) {
  if (unit === 'hour') return formatTime(value)
  if (unit === 'day') return formatDate(value, { day: 'numeric', month: 'short' })
  if (unit === 'month') return formatDate(value, spansYears ? { month: 'short', year: '2-digit' } : { month: 'short' })
  return String(new Date(value).getFullYear())
}

// ---- Datasets ----------------------------------------------------------------

// Insert a null point inside long gaps so the line breaks instead of bridging them
function withGaps(points, gap) {
  const result = []
  points.forEach((point, i) => {
    if (i > 0 && point.x - points[i - 1].x > gap) result.push({ x: (point.x + points[i - 1].x) / 2, y: null })
    result.push(point)
  })
  return result
}

function gapThreshold(points, resolution) {
  const minimum = { reading: 3 * DAY_MS, day: 7 * DAY_MS, week: 35 * DAY_MS }[resolution]
  const gaps = points.slice(1).map((p, i) => p.x - points[i].x).sort((a, b) => a - b)
  const median = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0
  return Math.max(minimum, median * 3)
}

function seriesDatasets(points, field, resolution, scale) {
  const { label, color } = SERIES[field]
  const gap = gapThreshold(points, resolution)
  const line = (key) => withGaps(points.map(p => ({ x: p.x, y: p[field][key], point: p })), gap)
  const datasets = []

  // Averaged points get a shaded min-max band behind the average line
  if (resolution !== 'reading') {
    datasets.push(
      { band: true, data: line('max'), borderWidth: 0, pointRadius: 0, pointHitRadius: 0, fill: '+1', backgroundColor: alpha(color, 0.14) },
      { band: true, data: line('min'), borderWidth: 0, pointRadius: 0, pointHitRadius: 0, fill: false },
    )
  }
  datasets.push({
    label,
    field,
    data: line('avg'),
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2 * scale,
    pointRadius: resolution === 'reading' ? 3 * scale : 0,
    pointHoverRadius: 5 * scale,
    pointBorderColor: '#fff',
    pointBorderWidth: resolution === 'reading' ? 1 * scale : 0,
    pointHitRadius: 8 * scale,
    tension: 0,
    fill: false,
  })
  return datasets
}

function yBounds(points, fields, step) {
  const values = points.flatMap(p => fields.flatMap(f => [p[f].min, p[f].max]))
  if (values.length === 0) return {}
  return {
    min: Math.floor((Math.min(...values) - step / 2) / step) * step,
    max: Math.ceil((Math.max(...values) + step / 2) / step) * step,
  }
}

/**
 * Chart.js config for a trend chart.
 * @param {Array} points - from chartPoints()
 * @param {Object} options
 *   fields: series to plot (['systolic', 'diastolic'] or ['pulse'])
 *   resolution: 'reading' | 'day' | 'week'
 *   range: { start, end } to pin the x axis (start may be null)
 *   scale: multiplier for fonts and line widths (used for the PDF render)
 *   showNotes: include reading notes in the tooltip
 */
export function trendChartConfig(points, { fields, resolution, range = {}, scale = 1, showNotes = false, interactive = true }) {
  const xMin = range.start ?? points[0]?.x ?? Date.now()
  const xMax = Math.max(range.end ?? Date.now(), points.at(-1)?.x ?? 0)
  const step = fields.includes('pulse') ? 10 : 20
  const spansYears = new Date(xMin).getFullYear() !== new Date(xMax).getFullYear()
  const font = (size, weight = 'normal') => ({ size: size * scale, weight, family: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' })
  let tickUnit = 'day'

  return {
    type: 'line',
    data: { datasets: fields.flatMap(field => seriesDatasets(points, field, resolution, scale)) },
    options: {
      responsive: interactive,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      normalized: true,
      spanGaps: false,
      layout: { padding: { top: 4 * scale, right: 8 * scale } },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: {
          display: fields.length > 1,
          position: 'top',
          align: 'end',
          labels: {
            filter: (item, data) => !data.datasets[item.datasetIndex].band,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 7 * scale,
            boxHeight: 7 * scale,
            padding: 14 * scale,
            color: INK.text,
            font: font(12),
          },
        },
        tooltip: {
          enabled: interactive,
          filter: (item) => !item.dataset.band && item.raw.y !== null,
          backgroundColor: '#ffffff',
          titleColor: '#0b0b0b',
          bodyColor: INK.text,
          footerColor: INK.muted,
          borderColor: 'rgba(15, 23, 42, 0.12)',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          titleFont: font(12, '600'),
          bodyFont: font(12),
          footerFont: font(11),
          callbacks: {
            title: (items) => {
              const point = items[0]?.raw.point
              if (!point) return ''
              if (resolution === 'reading') return `${formatDate(point.x)}, ${formatTime(point.x)}`
              if (resolution === 'week') return `Week of ${formatDate(point.x - 3.5 * DAY_MS)}`
              return formatDate(point.x)
            },
            label: (item) => {
              const { point } = item.raw
              const { label, unit } = SERIES[item.dataset.field]
              const stats = point[item.dataset.field]
              const range = stats.min !== stats.max ? `  (${stats.min}-${stats.max})` : ''
              return `${label}: ${stats.avg} ${unit}${range}`
            },
            footer: (items) => {
              const point = items[0]?.raw.point
              if (!point) return ''
              if (point.entry) return showNotes && point.entry.notes ? point.entry.notes : ''
              return `Average of ${point.count} reading${point.count === 1 ? '' : 's'}`
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: xMin,
          max: xMax,
          grid: { display: false },
          border: { color: INK.axis },
          afterBuildTicks: (axis) => {
            const { ticks, unit } = timeTicks(axis.min, axis.max, interactive ? 7 : 8)
            tickUnit = unit
            axis.ticks = ticks.map(value => ({ value }))
          },
          ticks: {
            color: INK.muted,
            font: font(11),
            maxRotation: 0,
            autoSkip: true,
            callback: (value) => tickLabel(value, tickUnit, spansYears),
          },
        },
        y: {
          ...yBounds(points, fields, step),
          grid: { color: INK.grid, drawTicks: false },
          border: { display: false },
          ticks: { stepSize: step, color: INK.muted, font: font(11), padding: 8 * scale },
        },
      },
    },
  }
}

// Renders a chart to a PNG data URL off-screen (for the PDF report)
export function renderChartImage(config, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const chart = new Chart(canvas, {
    ...config,
    options: { ...config.options, devicePixelRatio: 1 },
  })
  const image = chart.toBase64Image('image/png')
  chart.destroy()
  return image
}
