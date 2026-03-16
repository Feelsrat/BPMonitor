/**
 * Generate test BP data for local development
 * Run with: node scripts/generate-test-data.js
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to local data file
const LOCAL_DATA_FILE = join(process.cwd(), 'bp-data.json')

const noteTemplates = [
  'Just woke up',
  'Before medication',
  'After medication',
  'After exercise',
  'Feeling stressed',
  'Feeling relaxed',
  'After meal',
  'Before bed',
  'Regular checkup',
  'After coffee',
  'Post-workout',
  'Feeling tired',
  'After walking',
  'During work',
  'Weekend reading',
  'Doctor appointment',
  'Feeling dizzy',
  'After yoga',
  'Mid-day check',
  null, // Some entries without notes
  null,
  null,
]

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random date between start and end dates
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/**
 * Generate realistic BP values with some patterns
 * - Morning readings tend to be slightly higher
 * - After exercise readings are higher
 * - Relaxed readings are lower
 * - Some gradual trends over time
 */
function generateBPReading(hour, note, dayOffset) {
  // Base values with slight upward trend over time (aging effect)
  const trendFactor = Math.floor(dayOffset / 365) * 2 // +2 systolic per year
  let systolic = randomInt(110, 135) + trendFactor
  let diastolic = randomInt(70, 85) + Math.floor(trendFactor / 2)
  let pulse = randomInt(60, 75)

  // Time of day adjustments
  if (hour >= 6 && hour <= 9) {
    // Morning - slightly higher
    systolic += randomInt(5, 12)
    diastolic += randomInt(3, 7)
  } else if (hour >= 22 || hour <= 5) {
    // Night - slightly lower
    systolic -= randomInt(5, 12)
    diastolic -= randomInt(3, 7)
    pulse -= randomInt(5, 10)
  }

  // Note-based adjustments
  if (note === 'After exercise' || note === 'Post-workout' || note === 'After walking') {
    systolic += randomInt(15, 35)
    diastolic += randomInt(5, 15)
    pulse += randomInt(25, 45)
  } else if (note === 'Feeling relaxed' || note === 'Weekend reading' || note === 'After yoga') {
    systolic -= randomInt(8, 18)
    diastolic -= randomInt(5, 12)
    pulse -= randomInt(5, 15)
  } else if (note === 'Feeling stressed' || note === 'During work') {
    systolic += randomInt(12, 22)
    diastolic += randomInt(7, 13)
    pulse += randomInt(10, 20)
  } else if (note === 'After coffee') {
    systolic += randomInt(5, 15)
    pulse += randomInt(8, 18)
  } else if (note === 'Feeling dizzy') {
    systolic -= randomInt(10, 20)
    diastolic -= randomInt(5, 10)
  }

  // Ensure values stay within realistic ranges
  systolic = Math.max(90, Math.min(180, systolic))
  diastolic = Math.max(55, Math.min(110, diastolic))
  pulse = Math.max(45, Math.min(130, pulse))

  return { systolic, diastolic, pulse }
}

/**
 * Generate test data
 */
async function generateTestData() {
  const entries = []
  
  // Generate data for the last 2 years
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 2)
  
  // Generate 600-900 entries (average ~1 reading per day over 2 years)
  const numEntries = randomInt(600, 900)
  
  console.log(`\n🔬 Generating ${numEntries} test entries...`)
  console.log(`📅 Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`)
  
  for (let i = 0; i < numEntries; i++) {
    const timestamp = randomDate(startDate, endDate)
    const hour = timestamp.getHours()
    const dayOffset = Math.floor((endDate - timestamp) / (1000 * 60 * 60 * 24))
    const note = noteTemplates[randomInt(0, noteTemplates.length - 1)]
    const { systolic, diastolic, pulse } = generateBPReading(hour, note, dayOffset)
    
    const entry = {
      id: timestamp.getTime() + randomInt(0, 999), // Use timestamp-based ID
      systolic,
      diastolic,
      pulse,
      notes: note || '',
      timestamp: timestamp.toISOString(),
    }
    
    entries.push(entry)
    
    // Show progress
    if ((i + 1) % 100 === 0 || i === numEntries - 1) {
      const percent = Math.round(((i + 1) / numEntries) * 100)
      process.stdout.write(`\r✨ Progress: ${percent}% (${i + 1}/${numEntries})`)
    }
  }
  
  console.log('\n')
  
  // Sort by timestamp (newest first)
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  
  console.log('💾 Saving to local file (bp-data.json)...')
  
  try {
    // Save to local file
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(entries, null, 2), 'utf8')
    
    console.log(`\n✅ Successfully generated and saved ${entries.length} test entries!\n`)
    
    // Calculate some stats
    const avgSystolic = Math.round(entries.reduce((sum, e) => sum + e.systolic, 0) / entries.length)
    const avgDiastolic = Math.round(entries.reduce((sum, e) => sum + e.diastolic, 0) / entries.length)
    const avgPulse = Math.round(entries.reduce((sum, e) => sum + e.pulse, 0) / entries.length)
    const withNotes = entries.filter(e => e.notes).length
    
    // Find min/max values
    const maxSystolic = Math.max(...entries.map(e => e.systolic))
    const minSystolic = Math.min(...entries.map(e => e.systolic))
    const maxDiastolic = Math.max(...entries.map(e => e.diastolic))
    const minDiastolic = Math.min(...entries.map(e => e.diastolic))
    const maxPulse = Math.max(...entries.map(e => e.pulse))
    const minPulse = Math.min(...entries.map(e => e.pulse))
    
    console.log('📊 Generated Data Statistics:')
    console.log('─'.repeat(50))
    console.log(`📅 Date Range: ${entries[entries.length - 1].timestamp.split('T')[0]} → ${entries[0].timestamp.split('T')[0]}`)
    console.log(`📝 Entries with notes: ${withNotes} (${Math.round((withNotes / entries.length) * 100)}%)`)
    console.log(`\n💓 Blood Pressure:`)
    console.log(`   Average: ${avgSystolic}/${avgDiastolic} mmHg`)
    console.log(`   Range: ${minSystolic}-${maxSystolic}/${minDiastolic}-${maxDiastolic} mmHg`)
    console.log(`\n💗 Pulse:`)
    console.log(`   Average: ${avgPulse} BPM`)
    console.log(`   Range: ${minPulse}-${maxPulse} BPM`)
    console.log('─'.repeat(50))
    
    console.log('\n📦 Sample entries:')
    console.log('   Latest:', JSON.stringify(entries[0], null, 2).split('\n').join('\n   '))
    console.log('\n   Oldest:', JSON.stringify(entries[entries.length - 1], null, 2).split('\n').join('\n   '))
    
  } catch (error) {
    console.error('\n❌ Error saving to file:', error)
    process.exit(1)
  }
}

// Run the generator
console.log('\n🏥 BP Monitor - Test Data Generator')
console.log('═'.repeat(50))

generateTestData()
  .then(() => {
    console.log('\n✨ Test data generation complete!')
    console.log('🚀 Start your dev server to see the data: npm run dev\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
