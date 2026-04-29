import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generate a polished PDF report for blood pressure data
 * @param {Object} options - PDF generation options
 * @param {Array} options.entries - BP entries to include
 * @param {Object} options.stats - Pre-calculated statistics
 * @param {string} options.dateRange - Date range string (e.g., "Last 30 days")
 * @param {string} options.patientName - Optional patient name
 */
export function generateBPReport({ entries, stats, dateRange = 'All Time', patientName = '' }) {
  const doc = new jsPDF()
  
  // Document settings and colors
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  let yPos = 20
  
  // Color palette - modern report colors
  const colors = {
    primary: [26, 115, 232],
    secondary: [66, 133, 244],
    success: [52, 168, 83],
    warning: [251, 188, 4],
    danger: [234, 67, 53],
    dark: [32, 33, 36],
    ink: [60, 64, 67],
    muted: [95, 99, 104],
    light: [255, 255, 255],
    surface: [255, 255, 255],
    tableStripe: [248, 249, 250],
    chartBg: [248, 249, 250],
    white: [255, 255, 255],
    border: [218, 220, 224],
    blueTint: [232, 240, 254],
  }

  const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const sanitizePdfText = (value) => String(value ?? '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  const addSectionHeader = (title, yPosition) => {
    doc.setFillColor(...colors.primary)
    doc.circle(margin + 1.8, yPosition - 1.5, 1.8, 'F')
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.ink)
    doc.text(title, margin + 8, yPosition)
    
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.2)
    doc.line(margin, yPosition + 6, pageWidth - margin, yPosition + 6)
    
    return yPosition + 12
  }

  const addMetricCard = ({ x, y, width, label, value, caption = '', accent = colors.primary }) => {
    const cardHeight = 26
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.2)
    doc.setFillColor(...colors.surface)
    doc.roundedRect(x, y, width, cardHeight, 3, 3, 'FD')
    doc.setFillColor(...accent)
    doc.circle(x + 6, y + 8, 1.8, 'F')

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.muted)
    doc.text(label.toUpperCase(), x + 10, y + 9)

    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.ink)
    doc.text(String(value), x + 5, y + 18)

    if (caption) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.muted)
      doc.text(String(caption), x + 5, y + 23)
    }
  }

  const tableDefaults = {
    theme: 'plain',
    headStyles: {
      fillColor: colors.tableStripe,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      textColor: colors.ink,
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: colors.ink,
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
      lineColor: colors.border,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: colors.tableStripe,
    },
    margin: { left: margin, right: margin },
  }

  const addReportPage = () => {
    doc.addPage()
    doc.setFillColor(...colors.light)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
  }

  const addTrendSnapshot = (yPosition) => {
    if (sortedEntries.length === 0) {
      return yPosition
    }

    const valueSeries = [
      { key: 'systolic', label: 'Systolic', color: [239, 68, 68] },
      { key: 'diastolic', label: 'Diastolic', color: [245, 158, 11] },
      { key: 'pulse', label: 'Pulse', color: [59, 130, 246] },
    ]
    const values = valueSeries
      .flatMap(series => sortedEntries.map(entry => Number(entry[series.key])))
      .filter(Number.isFinite)

    if (values.length === 0) {
      return yPosition
    }

    let y = addSectionHeader('Trend Snapshot', yPosition)
    const chartWidth = pageWidth - 2 * margin
    const chartHeight = 96
    const plotWidth = chartWidth - 40
    const plotHeight = 56

    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)
    const yStep = 10
    const minValue = dataMin === dataMax ? Math.max(0, dataMin - 5) : dataMin
    const maxValue = dataMin === dataMax ? dataMax + 5 : dataMax
    const valueRange = Math.max(maxValue - minValue, 1)
    const yTicks = [minValue]
    for (let tick = Math.ceil(minValue / yStep) * yStep; tick < maxValue; tick += yStep) {
      if (tick !== minValue) {
        yTicks.push(tick)
      }
    }
    if (maxValue !== minValue) {
      yTicks.push(maxValue)
    }
    const uniqueYTicks = [...new Set(yTicks)]
    yTicks.length = 0
    uniqueYTicks.forEach(tick => {
      yTicks.push(tick)
    })

    const formatAxisDate = (timestamp, useTimeLabels) => {
      const date = new Date(timestamp)
      return useTimeLabels
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }

    const formatGapDuration = (gapMs) => {
      const dayMs = 24 * 60 * 60 * 1000
      const hourMs = 60 * 60 * 1000
      if (gapMs >= dayMs) {
        const days = Math.round(gapMs / dayMs)
        return `${days} day${days === 1 ? '' : 's'}`
      }
      const hours = Math.round(gapMs / hourMs)
      return `${hours} hour${hours === 1 ? '' : 's'}`
    }

    const entryTimes = sortedEntries.map(entry => new Date(entry.timestamp).getTime())
    const hasTimeline = entryTimes.every(Number.isFinite)
    const dayMs = 24 * 60 * 60 * 1000
    const gaps = hasTimeline
      ? entryTimes.slice(1).map((time, index) => time - entryTimes[index]).filter(gap => gap > 0)
      : []
    const sortedGaps = [...gaps].sort((a, b) => a - b)
    const medianGap = sortedGaps.length > 0 ? sortedGaps[Math.floor(sortedGaps.length / 2)] : 0
    const gapThreshold = sortedGaps.length >= 3 ? Math.max(7 * dayMs, medianGap * 3) : 7 * dayMs
    const segments = []

    sortedEntries.forEach((entry, index) => {
      if (!hasTimeline || index === 0) {
        segments.push({ entries: [entry], gapBefore: null })
        return
      }

      const gap = entryTimes[index] - entryTimes[index - 1]
      if (gap > gapThreshold) {
        segments.push({
          entries: [entry],
          gapBefore: {
            duration: gap,
            from: entryTimes[index - 1],
            to: entryTimes[index],
          },
        })
      } else {
        segments[segments.length - 1].entries.push(entry)
      }
    })

    const drawGapNote = (gap, yPosition) => {
      const fromDate = new Date(gap.from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const toDate = new Date(gap.to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const note = `Data gap: ${formatGapDuration(gap.duration)} without readings (${fromDate} to ${toDate})`
      doc.setDrawColor(...colors.border)
      doc.setLineWidth(0.2)
      doc.setFillColor(...colors.tableStripe)
      doc.roundedRect(margin, yPosition, chartWidth, 9, 3, 3, 'FD')
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.muted)
      doc.text(note, margin + 5, yPosition + 6)
      return yPosition + 14
    }

    const drawSegmentChart = (segmentEntries, yPosition, segmentIndex) => {
      const chartX = margin
      const chartY = yPosition
      const plotLeft = chartX + 28
      const plotTop = chartY + 20
      const segmentTimes = segmentEntries.map(entry => new Date(entry.timestamp).getTime())
      const firstTime = hasTimeline ? segmentTimes[0] : 0
      const lastTime = hasTimeline ? segmentTimes[segmentTimes.length - 1] : segmentEntries.length - 1
      const timeRange = Math.max(lastTime - firstTime, 1)
      const maxXTicks = segmentEntries.length === 1 ? 1 : Math.min(6, segmentEntries.length)
      const xTickTimes = Array.from({ length: maxXTicks }, (_, index) =>
        maxXTicks === 1 ? firstTime : firstTime + (timeRange / (maxXTicks - 1)) * index
      )
      const firstEntryDate = new Date(firstTime).toDateString()
      const lastEntryDate = new Date(lastTime).toDateString()
      const useTimeLabels = firstEntryDate === lastEntryDate
      const xFor = (timestamp, index) => segmentEntries.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (((hasTimeline ? timestamp : index) - firstTime) / timeRange) * plotWidth
      const yFor = (value) => plotTop + plotHeight - ((value - minValue) / valueRange) * plotHeight

      doc.setDrawColor(...colors.border)
      doc.setLineWidth(0.25)
      doc.setFillColor(...colors.surface)
      doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, 'FD')
      doc.setFillColor(...colors.chartBg)
      doc.roundedRect(plotLeft, plotTop, plotWidth, plotHeight, 2, 2, 'F')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.muted)
      doc.text(`Segment ${segmentIndex + 1}`, chartX + 5, chartY + 10)
      let legendX = plotLeft + 32
      valueSeries.forEach(series => {
        doc.setFillColor(...series.color)
        doc.circle(legendX, chartY + 8, 1.4, 'F')
        doc.setTextColor(...colors.muted)
        doc.text(series.label, legendX + 4, chartY + 10)
        legendX += 30
      })

      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.35)
      doc.line(plotLeft, plotTop, plotLeft, plotTop + plotHeight)
      doc.line(plotLeft, plotTop + plotHeight, plotLeft + plotWidth, plotTop + plotHeight)

      doc.setFontSize(7)
      doc.setTextColor(...colors.muted)
      doc.text('mmHg / bpm', chartX + 4, plotTop - 4)

      yTicks.forEach(tick => {
        const gridY = yFor(tick)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.2)
        doc.line(plotLeft, gridY, plotLeft + plotWidth, gridY)
        doc.setDrawColor(148, 163, 184)
        doc.line(plotLeft - 1.5, gridY, plotLeft, gridY)
        doc.setFontSize(6.5)
        doc.setTextColor(...colors.muted)
        doc.text(String(tick), plotLeft - 3, gridY + 2, { align: 'right' })
      })

      xTickTimes.forEach((timestamp, index) => {
        const gridX = xFor(timestamp, index)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.2)
        doc.line(gridX, plotTop, gridX, plotTop + plotHeight)
        doc.setDrawColor(148, 163, 184)
        doc.line(gridX, plotTop + plotHeight, gridX, plotTop + plotHeight + 1.5)
        doc.setTextColor(...colors.muted)
        doc.setFontSize(6.5)
        doc.text(hasTimeline ? formatAxisDate(timestamp, useTimeLabels) : String(index + 1), gridX, plotTop + plotHeight + 8, { align: 'center' })
      })

      valueSeries.forEach(series => {
        const points = segmentEntries
        .map((entry, index) => ({
          x: xFor(segmentTimes[index], index),
          y: yFor(Number(entry[series.key])),
          value: Number(entry[series.key]),
        }))
        .filter(point => Number.isFinite(point.value))

        if (points.length === 0) return

        doc.setDrawColor(...series.color)
        doc.setLineWidth(1.15)
        for (let i = 1; i < points.length; i++) {
          doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y)
        }

        doc.setFillColor(...series.color)
        points.forEach(point => {
          doc.circle(point.x, point.y, 0.9, 'F')
        })
      })

      doc.setFontSize(7)
      doc.setTextColor(...colors.muted)
      doc.text(useTimeLabels && hasTimeline ? new Date(firstTime).toLocaleDateString('en-GB') : hasTimeline ? 'Date' : 'Reading number', plotLeft + plotWidth / 2, chartY + chartHeight - 6, { align: 'center' })

      return yPosition + chartHeight + 10
    }

    segments.forEach((segment, index) => {
      const gapHeight = segment.gapBefore ? 14 : 0
      if (y + gapHeight + chartHeight > pageHeight - 28) {
        addReportPage()
        y = 22
      }

      if (segment.gapBefore) {
        y = drawGapNote(segment.gapBefore, y)
      }

      y = drawSegmentChart(segment.entries, y, index)
    })

    return y + 4
  }
  
  const generatedAt = new Date()

  // Clean report masthead
  doc.setFillColor(...colors.light)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  yPos = 18
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.primary)
  doc.text('BP Monitor', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colors.muted)
  doc.text(
    `Generated ${generatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  )

  yPos = 34
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.dark)
  doc.text('Blood Pressure Report', margin, yPos)

  yPos += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colors.muted)
  doc.text(`Report period: ${dateRange}`, margin, yPos)
  doc.text(`${entries.length} readings`, pageWidth - margin, yPos, { align: 'right' })

  if (patientName) {
    yPos += 6
    doc.text(`Patient: ${patientName}`, margin, yPos)
  }

  yPos += 8
  const accentY = yPos
  const accentParts = [
    { color: colors.primary, width: 18 },
    { color: colors.danger, width: 10 },
    { color: colors.warning, width: 10 },
    { color: colors.success, width: 14 },
  ]
  let accentX = margin
  accentParts.forEach(part => {
    doc.setFillColor(...part.color)
    doc.roundedRect(accentX, accentY, part.width, 2, 1, 1, 'F')
    accentX += part.width + 2
  })

  yPos += 14

  // At-a-glance metrics
  if (stats.avgSystolic && stats.avgDiastolic) {
    const gap = 5
    const cardWidth = (pageWidth - 2 * margin - gap * 2) / 4
    addMetricCard({
      x: margin,
      y: yPos,
      width: cardWidth,
      label: 'Average BP',
      value: `${stats.avgSystolic}/${stats.avgDiastolic}`,
      caption: 'mmHg',
      accent: colors.primary,
    })
    addMetricCard({
      x: margin + cardWidth + gap,
      y: yPos,
      width: cardWidth,
      label: 'Average Pulse',
      value: stats.avgPulse || 'N/A',
      caption: stats.avgPulse ? 'bpm' : '',
      accent: colors.secondary,
    })
    addMetricCard({
      x: margin + (cardWidth + gap) * 2,
      y: yPos,
      width: cardWidth,
      label: 'Reading Range',
      value: `${stats.minSystolic || 'N/A'}-${stats.maxSystolic || 'N/A'}`,
      caption: 'systolic min-max',
      accent: colors.success,
    })
    addMetricCard({
      x: margin + (cardWidth + gap) * 2,
      y: yPos + 30,
      width: cardWidth,
      label: 'Reading Range',
      value: `${stats.minDiastolic || 'N/A'}-${stats.maxDiastolic || 'N/A'}`,
      caption: 'diastolic min-max',
      accent: colors.success,
    })

    yPos += 40
  }
  
  yPos = addTrendSnapshot(yPos)

  if (yPos > 225) {
    addReportPage()
    yPos = 22
  }

  // Summary Statistics with section header
  yPos = addSectionHeader('Summary Statistics', yPos)
  
  const summaryData = [
    ['Metric', 'Average', 'Minimum', 'Maximum'],
    [
      'Systolic (mmHg)',
      stats.avgSystolic || 'N/A',
      stats.minSystolic || 'N/A',
      stats.maxSystolic || 'N/A'
    ],
    [
      'Diastolic (mmHg)',
      stats.avgDiastolic || 'N/A',
      stats.minDiastolic || 'N/A',
      stats.maxDiastolic || 'N/A'
    ],
    [
      'Pulse (bpm)',
      stats.avgPulse || 'N/A',
      stats.minPulse || 'N/A',
      stats.maxPulse || 'N/A'
    ],
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { 
      fillColor: colors.primary,
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'center',
      textColor: colors.white,
    },
    bodyStyles: {
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    ...tableDefaults,
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })
  
  yPos = doc.lastAutoTable.finalY + 14
  
  // Check if we need a new page
  if (yPos > 240) {
    addReportPage()
    yPos = 20
  }
  
  // Time of Day Analysis
  if (stats.timeOfDay && stats.timeOfDay.length > 0) {
    yPos = addSectionHeader('Time of Day Analysis', yPos)
    
    const timeData = [
      ['Period', 'Readings', 'Avg Systolic', 'Avg Diastolic'],
      ...stats.timeOfDay.map(slot => [
        sanitizePdfText(slot.label),
        slot.count,
        slot.avgSystolic || 'N/A',
        slot.avgDiastolic || 'N/A'
      ])
    ]
    
    autoTable(doc, {
      startY: yPos,
      head: [timeData[0]],
      body: timeData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.primary,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center',
        textColor: colors.white,
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      ...tableDefaults,
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 14
  }
  
  // Check if we need a new page
  if (yPos > 240) {
    addReportPage()
    yPos = 20
  }
  
  // Day of Week Pattern
  if (stats.dayOfWeek && stats.dayOfWeek.length > 0) {
    yPos = addSectionHeader('Day of Week Pattern', yPos)
    
    const dayData = [
      ['Day', 'Readings', 'Avg Systolic', 'Avg Diastolic'],
      ...stats.dayOfWeek.map(day => [
        day.label,
        day.count,
        day.avgSystolic || 'N/A',
        day.avgDiastolic || 'N/A'
      ])
    ]
    
    autoTable(doc, {
      startY: yPos,
      head: [dayData[0]],
      body: dayData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.primary,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center',
        textColor: colors.white,
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      ...tableDefaults,
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 14
  }
  
  // Check if we need a new page
  if (yPos > 220) {
    addReportPage()
    yPos = 20
  }
  
  // Trend Analysis
  if (stats.trends) {
    yPos = addSectionHeader('30-Day Trend Analysis', yPos)
    
    const trendData = [
      ['Period', 'Readings', 'Avg Systolic', 'Avg Diastolic'],
      [
        'Last 30 Days',
        stats.trends.last30?.count || 0,
        stats.trends.last30?.avgSystolic || 'N/A',
        stats.trends.last30?.avgDiastolic || 'N/A'
      ],
      [
        'Previous 30 Days',
        stats.trends.prev30?.count || 0,
        stats.trends.prev30?.avgSystolic || 'N/A',
        stats.trends.prev30?.avgDiastolic || 'N/A'
      ],
      [
        'Change',
        '-',
        stats.trends.change?.systolic > 0 ? `+${stats.trends.change.systolic}` : stats.trends.change?.systolic || 'N/A',
        stats.trends.change?.diastolic > 0 ? `+${stats.trends.change.diastolic}` : stats.trends.change?.diastolic || 'N/A'
      ],
    ]
    
    autoTable(doc, {
      startY: yPos,
      head: [trendData[0]],
      body: trendData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.primary,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center',
        textColor: colors.white,
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      ...tableDefaults,
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 14
  }
  
  // Monthly Comparison
  if (stats.monthly) {
    // Check if we need a new page
    if (yPos > 220) {
      addReportPage()
      yPos = 20
    }
    
    yPos = addSectionHeader('Monthly Comparison', yPos)
    
    const monthlyData = [
      ['Period', 'Readings', 'Avg Systolic', 'Avg Diastolic'],
      [
        'This Month',
        stats.monthly.thisMonth?.count || 0,
        stats.monthly.thisMonth?.avgSystolic || 'N/A',
        stats.monthly.thisMonth?.avgDiastolic || 'N/A'
      ],
      [
        'Last Month',
        stats.monthly.lastMonth?.count || 0,
        stats.monthly.lastMonth?.avgSystolic || 'N/A',
        stats.monthly.lastMonth?.avgDiastolic || 'N/A'
      ],
      [
        'Change',
        '-',
        stats.monthly.change?.systolic > 0 ? `+${stats.monthly.change.systolic}` : stats.monthly.change?.systolic || 'N/A',
        stats.monthly.change?.diastolic > 0 ? `+${stats.monthly.change.diastolic}` : stats.monthly.change?.diastolic || 'N/A'
      ],
    ]
    
    autoTable(doc, {
      startY: yPos,
      head: [monthlyData[0]],
      body: monthlyData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.primary,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center',
        textColor: colors.white,
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      ...tableDefaults,
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 14
  }
  
  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.25)
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16)
    
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.muted)
    doc.text(
      `Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 8
    )
    doc.text(
      'BP Monitor Report',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
    doc.text(
      generatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    )
  }
  
  // Save the PDF with descriptive filename
  const dateStr = new Date().toISOString().split('T')[0]
  const periodStr = dateRange.replace(/\s+/g, '_').replace(/[()]/g, '')
  const readingsCount = entries.length
  const filename = `BP_Report_${dateStr}_${periodStr}_${readingsCount}readings.pdf`
  doc.save(filename)
}
