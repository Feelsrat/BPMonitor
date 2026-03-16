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
  
  // Document settings
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPos = 20
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Blood Pressure Medical Report', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 15
  
  // Patient Information Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Information', margin, yPos)
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (patientName) {
    doc.text(`Patient: ${patientName}`, margin, yPos)
    yPos += 6
  }
  doc.text(`Report Period: ${dateRange}`, margin, yPos)
  yPos += 6
  doc.text(`Total Readings: ${entries.length}`, margin, yPos)
  yPos += 12
  
  // Summary Statistics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics', margin, yPos)
  yPos += 8
  
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
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: margin, right: margin },
  })
  
  yPos = doc.lastAutoTable.finalY + 12
  
  // BP Category Distribution
  if (stats.categories) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Blood Pressure Categories', margin, yPos)
    yPos += 8
    
    const categoryData = [
      ['Category', 'Range', 'Count', 'Percentage'],
      [
        'Normal',
        '< 120/80 mmHg',
        stats.categories.normal?.count || 0,
        `${stats.categories.normal?.percentage || 0}%`
      ],
      [
        'Elevated',
        '120-129 / < 80 mmHg',
        stats.categories.elevated?.count || 0,
        `${stats.categories.elevated?.percentage || 0}%`
      ],
      [
        'Stage 1 Hypertension',
        '130-139 / 80-89 mmHg',
        stats.categories.stage1?.count || 0,
        `${stats.categories.stage1?.percentage || 0}%`
      ],
      [
        'Stage 2 Hypertension',
        '>= 140/90 mmHg',
        stats.categories.stage2?.count || 0,
        `${stats.categories.stage2?.percentage || 0}%`
      ],
    ]
    
    autoTable(doc, {
      startY: yPos,
      head: [categoryData[0]],
      body: categoryData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 12
  }
  
  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }
  
  // Time of Day Analysis
  if (stats.timeOfDay && stats.timeOfDay.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Time of Day Analysis', margin, yPos)
    yPos += 8
    
    const timeData = [
      ['Period', 'Readings', 'Avg Systolic', 'Avg Diastolic'],
      ...stats.timeOfDay.map(slot => [
        slot.label,
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
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 12
  }
  
  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }
  
  // Day of Week Pattern
  if (stats.dayOfWeek && stats.dayOfWeek.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Day of Week Pattern', margin, yPos)
    yPos += 8
    
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
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 12
  }
  
  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }
  
  // Trend Analysis
  if (stats.trends) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('30-Day Trend Analysis', margin, yPos)
    yPos += 8
    
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
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Trend Direction: ${stats.trends.change?.direction || 'N/A'}`, margin, yPos)
    yPos += 12
  }
  
  // Monthly Comparison
  if (stats.monthly) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Monthly Comparison', margin, yPos)
    yPos += 8
    
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
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Trend Direction: ${stats.monthly.change?.direction || 'N/A'}`, margin, yPos)
    yPos += 12
  }
  
  // Recent Readings Table (last 20 entries)
  if (entries.length > 0) {
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recent Readings', margin, yPos)
    yPos += 8
    
    const recentEntries = entries.slice(0, 20)
    const readingsData = [
      ['Date', 'Time', 'Systolic', 'Diastolic', 'Pulse', 'Category'],
      ...recentEntries.map(entry => {
        const date = new Date(entry.timestamp)
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          entry.systolic,
          entry.diastolic,
          entry.pulse,
          entry.category || '-'
        ]
      })
    ]
    
    autoTable(doc, {
      startY: yPos,
      head: [readingsData[0]],
      body: readingsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
    })
    
    yPos = doc.lastAutoTable.finalY + 12
  }
  
  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Page ${i} of ${pageCount} | BP Monitor Report | For medical consultation purposes`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  // Save the PDF
  const filename = `BP_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
