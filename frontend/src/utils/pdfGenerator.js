import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generate a professional medical report PDF for blood pressure data
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
  
  // Color palette - professional medical colors
  const colors = {
    primary: [41, 128, 185],      // Blue
    secondary: [52, 152, 219],    // Light blue
    success: [46, 204, 113],      // Green
    warning: [241, 196, 15],      // Yellow
    danger: [231, 76, 60],        // Red
    dark: [44, 62, 80],           // Dark blue-gray
    light: [236, 240, 241],       // Light gray
    white: [255, 255, 255],
    border: [189, 195, 199],      // Border gray
  }

  const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const sanitizePdfText = (value) => String(value ?? '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Helper function to add section header with decorative bar
  const addSectionHeader = (title, yPosition) => {
    // Left accent bar
    doc.setFillColor(...colors.primary)
    doc.rect(margin - 5, yPosition - 4, 3, 8, 'F')
    
    // Section title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.dark)
    doc.text(title, margin + 5, yPosition)
    
    // Underline
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.5)
    doc.line(margin + 5, yPosition + 2, pageWidth - margin, yPosition + 2)
    
    return yPosition + 10
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
    const chartX = margin
    const chartY = y
    const chartWidth = pageWidth - 2 * margin
    const chartHeight = 70
    const plotLeft = chartX + 20
    const plotTop = chartY + 18
    const plotWidth = chartWidth - 28
    const plotHeight = 36

    const minValue = Math.max(0, Math.floor((Math.min(...values) - 10) / 10) * 10)
    const maxValue = Math.ceil((Math.max(...values) + 10) / 10) * 10
    const valueRange = Math.max(maxValue - minValue, 1)
    const xFor = (index) => sortedEntries.length === 1
      ? plotLeft + plotWidth / 2
      : plotLeft + (index / (sortedEntries.length - 1)) * plotWidth
    const yFor = (value) => plotTop + plotHeight - ((value - minValue) / valueRange) * plotHeight

    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.4)
    doc.setFillColor(250, 252, 255)
    doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, 'FD')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    let legendX = plotLeft
    valueSeries.forEach(series => {
      doc.setFillColor(...series.color)
      doc.circle(legendX, chartY + 8, 1.4, 'F')
      doc.setTextColor(70, 70, 70)
      doc.text(series.label, legendX + 4, chartY + 10)
      legendX += 30
    })

    doc.setDrawColor(225, 229, 235)
    doc.setLineWidth(0.2)
    for (let i = 0; i <= 4; i++) {
      const gridY = plotTop + (plotHeight / 4) * i
      doc.line(plotLeft, gridY, plotLeft + plotWidth, gridY)
    }

    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.4)
    doc.line(plotLeft, plotTop, plotLeft, plotTop + plotHeight)
    doc.line(plotLeft, plotTop + plotHeight, plotLeft + plotWidth, plotTop + plotHeight)

    doc.setFontSize(7)
    doc.setTextColor(90, 90, 90)
    doc.text(String(maxValue), chartX + 4, plotTop + 2)
    doc.text(String(minValue), chartX + 4, plotTop + plotHeight)

    valueSeries.forEach(series => {
      const points = sortedEntries
        .map((entry, index) => ({
          x: xFor(index),
          y: yFor(Number(entry[series.key])),
          value: Number(entry[series.key]),
        }))
        .filter(point => Number.isFinite(point.value))

      if (points.length === 0) return

      doc.setDrawColor(...series.color)
      doc.setLineWidth(1)
      for (let i = 1; i < points.length; i++) {
        doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y)
      }

      doc.setFillColor(...series.color)
      points.forEach(point => {
        doc.circle(point.x, point.y, 1, 'F')
      })
    })

    const firstDate = new Date(sortedEntries[0].timestamp).toLocaleDateString()
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].timestamp).toLocaleDateString()
    doc.setFontSize(7)
    doc.setTextColor(90, 90, 90)
    doc.text(firstDate, plotLeft, chartY + chartHeight - 6)
    if (sortedEntries.length > 1) {
      doc.text(lastDate, plotLeft + plotWidth, chartY + chartHeight - 6, { align: 'right' })
    }

    return y + chartHeight + 14
  }
  
  // Add a subtle background color to the page
  doc.setFillColor(...colors.light)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Header with colored bar and gradient effect
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, pageWidth, 8, 'F')
  
  yPos = 18
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.dark)
  doc.text('Blood Pressure Medical Report', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 15
  
  // Patient Information Section with colored background and border
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.5)
  doc.setFillColor(...colors.light)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'FD')
  
  yPos += 8
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.dark)
  doc.text('Patient Information', margin + 5, yPos)
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  if (patientName) {
    doc.text(`Patient: ${patientName}`, margin + 5, yPos)
    yPos += 6
  }
  doc.text(`Report Period: ${dateRange}`, margin + 5, yPos)
  yPos += 6
  doc.text(`Total Readings: ${entries.length}`, margin + 5, yPos)
  yPos += 16
  
  // Quick Summary Box - At-a-Glance Highlights
  if (stats.avgSystolic && stats.avgDiastolic) {
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(1)
    doc.setFillColor(250, 252, 255) // Very light blue
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 24, 3, 3, 'FD')
    
    yPos += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.primary)
    doc.text('Quick Summary', margin + 5, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    
    // Average BP
    const avgBP = `Average: ${stats.avgSystolic}/${stats.avgDiastolic} mmHg`
    doc.text(avgBP, margin + 5, yPos)
    
    // Pulse if available
    if (stats.avgPulse) {
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'normal')
      doc.text(`Pulse: ${stats.avgPulse} bpm`, margin + 85, yPos)
    }
    
    yPos += 14
  }
  
  yPos = addTrendSnapshot(yPos)

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
    doc.addPage()
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
    doc.addPage()
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
    doc.addPage()
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
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.dark)
    const trendText = `Trend Direction: ${sanitizePdfText(stats.trends.change?.direction || 'N/A')}`
    const trendColor = stats.trends.change?.systolic < 0 ? colors.success : 
                       stats.trends.change?.systolic > 0 ? colors.danger : colors.dark
    doc.setTextColor(...trendColor)
    doc.text(trendText, margin, yPos)
    doc.setTextColor(...colors.dark)
    yPos += 14
  }
  
  // Monthly Comparison
  if (stats.monthly) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage()
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
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const monthlyTrendText = `Trend Direction: ${sanitizePdfText(stats.monthly.change?.direction || 'N/A')}`
    const monthlyTrendColor = stats.monthly.change?.systolic < 0 ? colors.success : 
                              stats.monthly.change?.systolic > 0 ? colors.danger : colors.dark
    doc.setTextColor(...monthlyTrendColor)
    doc.text(monthlyTrendText, margin, yPos)
    doc.setTextColor(...colors.dark)
    yPos += 14
  }
  
  // Add medical disclaimer/notes at the end if space permits
  if (yPos < pageHeight - 50) {
    yPos += 10
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Medical Disclaimer:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    const disclaimerText = 'This report is for informational purposes only and should not replace professional medical advice. Please consult with your healthcare provider for proper diagnosis and treatment.'
    const splitText = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin)
    doc.text(splitText, margin, yPos)
  }
  
  // Footer on all pages with professional styling
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Add footer bar
    doc.setFillColor(...colors.primary)
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')
    
    // Footer text
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text(
      `Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 7
    )
    doc.text(
      'BP Monitor Medical Report',
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    )
    doc.text(
      'For medical consultation',
      pageWidth - margin,
      pageHeight - 7,
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
