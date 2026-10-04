// Splits one CSV line, honouring quoted fields and "" escapes
function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && inQuotes && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  return values
}

function parseCSV(text) {
  const [headerLine = '', ...lines] = text.trim().split(/\r?\n/)
  const header = parseCSVLine(headerLine).map(column => column.toLowerCase())
  const missing = ['systolic', 'diastolic', 'pulse', 'timestamp'].filter(column => !header.includes(column))
  if (missing.length) throw new Error(`CSV header is missing: ${missing.join(', ')}`)

  return lines
    .filter(line => line.trim())
    .map(line => {
      const values = parseCSVLine(line)
      return Object.fromEntries(header.map((column, i) => [column, values[i] ?? '']))
    })
}

// Parses an import file (CSV or JSON array) into raw entries; the server validates them
export function parseImportFile(filename, text) {
  const entries = filename.toLowerCase().endsWith('.json') ? JSON.parse(text) : parseCSV(text)
  if (!Array.isArray(entries)) throw new Error('JSON must be an array of readings')
  if (entries.length === 0) throw new Error('No readings found in the file')
  return entries
}
