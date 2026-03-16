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
    success: [46, 204, 113],      // Green
    warning: [241, 196, 15],      // Yellow
    danger: [231, 76, 60],        // Red
    dark: [44, 62, 80],           // Dark blue-gray
    light: [236, 240, 241],       // Light gray
    white: [255, 255, 255],
  }
  
  // Add a subtle background color to the page
  doc.setFillColor(...colors.light)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Header with colored bar
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
  
  // Patient Information Section with colored background
  doc.setFillColor(...colors.light)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F')
  
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
  yPos += 12
  
  // Summary Statistics with visual enhancement
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.dark)
  doc.text('📊 Summary Statistics', margin, yPos)
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
  
  yPos = doc.lastAutoTable.finalY + 12
  
  // BP Category Distribution
  if (stats.categories) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.dark)
    doc.text('❤️ Blood Pressure Categories', margin, yPos)
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
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: function(data) {
        // Color code the rows based on category
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.text[0] === 'Normal') {
            data.cell.styles.textColor = colors.success
          } else if (data.cell.text[0] === 'Elevated') {
            data.cell.styles.textColor = colors.warning
          } else if (data.cell.text[0].includes('Stage')) {
            data.cell.styles.textColor = colors.danger
          }
        }
      },
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
    doc.setTextColor(...colors.dark)
    doc.text('🕐 Time of Day Analysis', margin, yPos)
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
    doc.setTextColor(...colors.dark)
    doc.text('📅 Day of Week Pattern', margin, yPos)
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
    doc.setTextColor(...colors.dark)
    doc.text('📈 30-Day Trend Analysis', margin, yPos)
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
    const trendText = `Trend Direction: ${stats.trends.change?.direction || 'N/A'}`
    const trendColor = stats.trends.change?.systolic < 0 ? colors.success : 
                       stats.trends.change?.systolic > 0 ? colors.danger : colors.dark
    doc.setTextColor(...trendColor)
    doc.text(trendText, margin, yPos)
    doc.setTextColor(...colors.dark)
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
    doc.setTextColor(...colors.dark)
    doc.text('📊 Monthly Comparison', margin, yPos)
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
    const monthlyTrendText = `Trend Direction: ${stats.monthly.change?.direction || 'N/A'}`
    const monthlyTrendColor = stats.monthly.change?.systolic < 0 ? colors.success : 
                              stats.monthly.change?.systolic > 0 ? colors.danger : colors.dark
    doc.setTextColor(...monthlyTrendColor)
    doc.text(monthlyTrendText, margin, yPos)
    doc.setTextColor(...colors.dark)
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
    doc.setTextColor(...colors.dark)
    doc.text('📋 Recent Readings', margin, yPos)
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
      headStyles: { 
        fillColor: colors.primary,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        textColor: colors.white,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [250, 251, 252],
      },
      columnStyles: {
        2: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'center', fontStyle: 'bold' },
        4: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 12
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
  
  // Save the PDF with timestamp
  const filename = `BP_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
