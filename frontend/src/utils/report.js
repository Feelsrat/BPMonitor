import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  summarize, byTimeOfDay, byMonth, byDay, chartPoints, chartResolution,
  describeSpan, formatDate, formatTime, formatBP,
} from './bp'
import { trendChartConfig, renderChartImage } from './chart'

const PAGE = { width: 210, height: 297, margin: 16 }
const CONTENT_WIDTH = PAGE.width - 2 * PAGE.margin
const BOTTOM = PAGE.height - 20

const C = {
  ink: [15, 23, 42],
  text: [51, 65, 85],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  fill: [248, 250, 252],
}

// The standard PDF fonts only cover Latin-1
const pdfText = (value) => String(value ?? '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '').replace(/\s+/g, ' ').trim()

const CHART_DESCRIPTIONS = {
  reading: 'Each point is one reading.',
  day: 'Daily averages. The shaded band shows the lowest and highest reading of each day.',
  week: 'Weekly averages. The shaded band shows the lowest and highest reading of each week.',
}

/**
 * Builds and downloads the PDF report.
 * @param {Object} options
 * @param {Array} options.entries - readings in the period, newest first
 * @param {{start, end}} options.range - the selected period (start null for all readings)
 * @param {string} options.rangeLabel - e.g. "Last 90 days"
 * @param {string} [options.name] - name printed on the report
 * @param {boolean} [options.includeReadings] - append the list of all readings
 * @param {boolean} [options.includeNotes] - include notes in that list
 * @param {string} options.filename
 */
export function generateReport({ entries, range, rangeLabel, name = '', includeReadings = true, includeNotes = true, filename }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { margin } = PAGE
  const generated = new Date()
  const stats = summarize(entries)
  let y = 0

  const font = (size, style = 'normal', color = C.text) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }

  const ensureSpace = (height) => {
    if (y + height > BOTTOM) {
      doc.addPage()
      y = 20
    }
  }

  const section = (title, description = '') => {
    ensureSpace(description ? 40 : 34)
    font(11, 'bold', C.ink)
    doc.text(title, margin, y)
    y += 5
    if (description) {
      font(8, 'normal', C.muted)
      doc.text(description, margin, y)
      y += 4
    }
    y += 2
  }

  const table = (options) => {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, bottom: 22 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: C.text,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        lineColor: C.border,
        lineWidth: { bottom: 0.15 },
      },
      headStyles: { fontStyle: 'bold', textColor: C.muted, fillColor: C.fill, fontSize: 7.5 },
      ...options,
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ---- Header
  y = 22
  font(18, 'bold', C.ink)
  doc.text('Blood pressure report', margin, y)
  font(8, 'normal', C.muted)
  doc.text(`Generated ${formatDate(generated)}`, PAGE.width - margin, y, { align: 'right' })

  y += 7
  if (name) {
    font(11, 'normal', C.ink)
    doc.text(pdfText(name), margin, y)
    y += 5.5
  }
  font(9, 'normal', C.muted)
  doc.text(`Home readings: ${describeSpan(entries)} (${rangeLabel})`, margin, y)

  y += 5
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(margin, y, PAGE.width - margin, y)
  y += 7

  // ---- Key figures
  const tiles = [
    { label: 'Average blood pressure', value: formatBP(stats.systolic.avg, stats.diastolic.avg), unit: 'mmHg' },
    { label: 'Average pulse', value: String(stats.pulse.avg ?? '-'), unit: 'bpm' },
    { label: 'Readings', value: String(stats.count), unit: `on ${stats.days} day${stats.days === 1 ? '' : 's'}` },
    {
      label: 'Lowest - highest',
      value: `${stats.systolic.min}-${stats.systolic.max}`,
      unit: `/ ${stats.diastolic.min}-${stats.diastolic.max}`,
    },
  ]
  const gap = 4
  const tileWidth = (CONTENT_WIDTH - gap * (tiles.length - 1)) / tiles.length
  tiles.forEach((tile, i) => {
    const x = margin + i * (tileWidth + gap)
    doc.setDrawColor(...C.border)
    doc.setFillColor(...C.fill)
    doc.roundedRect(x, y, tileWidth, 19, 2, 2, 'FD')
    font(7.5, 'normal', C.muted)
    doc.text(tile.label, x + 4, y + 6)
    font(14, 'bold', C.ink)
    doc.text(tile.value, x + 4, y + 14)
    const valueWidth = doc.getTextWidth(tile.value)
    font(8, 'normal', C.muted)
    doc.text(tile.unit, x + 4 + valueWidth + 1.5, y + 14)
  })
  y += 19 + 11

  // ---- Charts (rendered with the same Chart.js config as the app)
  const resolution = chartResolution(entries)
  const points = chartPoints(entries, resolution)
  const chartOptions = { resolution, range, scale: 2.6, interactive: false }
  const pxPerMm = 10

  const chart = (fields, height) => {
    const config = trendChartConfig(points, { ...chartOptions, fields })
    const image = renderChartImage(config, CONTENT_WIDTH * pxPerMm, height * pxPerMm)
    doc.addImage(image, 'PNG', margin, y, CONTENT_WIDTH, height)
    y += height + 9
  }

  section('Blood pressure', CHART_DESCRIPTIONS[resolution])
  chart(['systolic', 'diastolic'], 68)
  section('Pulse')
  chart(['pulse'], 32)

  // ---- Averages
  const averageRow = (label, group, extra = []) => [
    label,
    group.count,
    group.count ? formatBP(group.systolic.avg, group.diastolic.avg) : '-',
    ...extra,
    group.pulse.avg ?? '-',
  ]
  const numberColumns = { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
  const headAlign = (head) => head.map((label, i) => ({ content: label, styles: { halign: i === 0 ? 'left' : 'right' } }))

  section('Averages by time of day')
  table({
    head: [headAlign(['Time of day', 'Readings', 'Average BP (mmHg)', 'Average pulse (bpm)'])],
    body: [
      ...byTimeOfDay(entries).map(slot => averageRow(`${slot.label} (${slot.hours})`, slot)),
      averageRow('All readings', stats).map(content => ({ content, styles: { fontStyle: 'bold', textColor: C.ink } })),
    ],
    columnStyles: numberColumns,
  })

  const months = byMonth(entries)
  if (months.length > 1) {
    section('Monthly averages')
    table({
      head: [headAlign(['Month', 'Readings', 'Average BP (mmHg)', 'Range (mmHg)', 'Average pulse (bpm)'])],
      body: months.map(month => averageRow(
        formatDate(month.date, { month: 'long', year: 'numeric' }),
        month,
        [`${month.systolic.min}-${month.systolic.max} / ${month.diastolic.min}-${month.diastolic.max}`],
      )),
      columnStyles: numberColumns,
    })
  }

  // ---- All readings, grouped by day
  if (includeReadings) {
    section('All readings', `${entries.length} reading${entries.length === 1 ? '' : 's'}, newest first.`)

    const body = byDay(entries).flatMap(day => day.entries.map((entry, i) => [
      i === 0 ? formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '',
      formatTime(entry.timestamp),
      formatBP(entry.systolic, entry.diastolic),
      entry.pulse,
      ...(includeNotes ? [pdfText(entry.notes)] : []),
    ]))

    table({
      head: [headAlign(['Date', 'Time', 'BP (mmHg)', 'Pulse (bpm)', ...(includeNotes ? ['Notes'] : [])])
        .map((cell, i) => (i === 4 ? { ...cell, styles: { halign: 'left' } } : cell))],
      body,
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: C.text,
        cellPadding: { top: 1.4, bottom: 1.4, left: 2, right: 2 },
        lineWidth: 0,
      },
      columnStyles: {
        0: { cellWidth: 30, textColor: C.ink, fontStyle: 'bold' },
        1: { cellWidth: 14, halign: 'right' },
        2: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: C.ink },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellPadding: { top: 1.4, bottom: 1.4, left: 6, right: 2 } },
      },
      // A rule above the first reading of each day
      didDrawCell: ({ row, column, cell, section: part }) => {
        if (part === 'body' && column.index === 0 && row.raw[0] && row.index > 0) {
          doc.setDrawColor(...C.border)
          doc.setLineWidth(0.2)
          doc.line(margin, cell.y, PAGE.width - margin, cell.y)
        }
      },
    })
  }

  // ---- Footer on every page
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.2)
    doc.line(margin, PAGE.height - 14, PAGE.width - margin, PAGE.height - 14)
    font(7.5, 'normal', C.muted)
    doc.text(['Blood pressure report', pdfText(name)].filter(Boolean).join(' - '), margin, PAGE.height - 9)
    doc.text(`Page ${page} of ${pages}`, PAGE.width - margin, PAGE.height - 9, { align: 'right' })
  }

  doc.save(filename)
}
