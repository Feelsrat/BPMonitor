<template>
  <div class="max-w-4xl mx-auto px-4 py-4 sm:py-8">
    <BaseCard>
      <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Import Data</h2>

      <div class="space-y-4">
        <div class="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 transition">
          <input ref="fileInput" type="file" accept=".csv,.json" class="hidden" @change="onFileSelected" />
          <BaseButton variant="primary" @click="fileInput.click()">
            Click to select CSV or JSON file
          </BaseButton>
          <p v-if="selectedFile" class="text-green-600 mt-2">
            Selected: {{ selectedFile.name }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            v-for="mode in modes"
            :key="mode.value"
            class="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer"
            :class="importMode === mode.value ? mode.activeClass : 'border-gray-200'"
          >
            <input v-model="importMode" type="radio" :value="mode.value" class="mr-2 sm:mr-3 flex-shrink-0" />
            <div>
              <div class="font-semibold text-gray-800 text-sm sm:text-base">{{ mode.label }}</div>
              <div class="text-xs sm:text-sm text-gray-600">{{ mode.description }}</div>
            </div>
          </label>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <BaseButton variant="success" :disabled="!selectedFile" :loading="isImporting" full-width @click="importFile">
            {{ isImporting ? 'Importing...' : 'Import' }}
          </BaseButton>
          <BaseButton variant="secondary" full-width @click="resetForm">
            Reset
          </BaseButton>
        </div>

        <BaseAlert v-if="successMessage" type="success">
          {{ successMessage }}
        </BaseAlert>
        <BaseAlert v-if="errorMessage" type="error">
          {{ errorMessage }}
        </BaseAlert>

        <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
          <div class="font-semibold mb-2">Supported Formats:</div>
          <div><strong>CSV:</strong> header row with Systolic, Diastolic, Pulse, Timestamp and optionally Notes</div>
          <div><strong>JSON:</strong> array of {systolic, diastolic, pulse, notes, timestamp} objects</div>
          <div class="text-gray-600 mt-2">Example CSV row: 120,80,72,Morning reading,2024-01-15T08:30:00Z</div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { importData, errorMessage as apiError } from '../services/api'

const modes = [
  { value: 'merge', label: 'Merge Data', description: 'Add to existing entries (duplicates are skipped)', activeClass: 'border-blue-500 bg-blue-50' },
  { value: 'replace', label: 'Replace Data', description: 'Delete all existing entries first', activeClass: 'border-red-500 bg-red-50' },
]

const fileInput = ref(null)
const selectedFile = ref(null)
const importMode = ref('merge')
const isImporting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const onFileSelected = (event) => {
  selectedFile.value = event.target.files?.[0] ?? null
  errorMessage.value = ''
  successMessage.value = ''
}

// Splits one CSV line, honouring quoted fields and "" escapes
const parseCSVLine = (line) => {
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

const parseCSV = (text) => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/)
  const header = parseCSVLine(headerLine).map(column => column.toLowerCase())
  const required = ['systolic', 'diastolic', 'pulse', 'timestamp']
  const missing = required.filter(column => !header.includes(column))
  if (missing.length) {
    throw new Error(`CSV header is missing: ${missing.join(', ')}`)
  }

  return lines
    .filter(line => line.trim())
    .map(line => {
      const values = parseCSVLine(line)
      return Object.fromEntries(header.map((column, i) => [column, values[i] ?? '']))
    })
}

const parseJSON = (text) => {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('JSON must be an array of entries')
  return data
}

const importFile = async () => {
  isImporting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const text = await selectedFile.value.text()
    const name = selectedFile.value.name.toLowerCase()
    const entries = name.endsWith('.json') ? parseJSON(text) : parseCSV(text)
    if (entries.length === 0) throw new Error('No entries found in file')

    if (importMode.value === 'replace' && !confirm('Replace ALL existing entries with this file?')) return

    const { data } = await importData(entries, importMode.value)
    resetForm()
    successMessage.value = data.message
  } catch (error) {
    errorMessage.value = apiError(error, error.message || 'Failed to import data')
  } finally {
    isImporting.value = false
  }
}

const resetForm = () => {
  selectedFile.value = null
  importMode.value = 'merge'
  successMessage.value = ''
  errorMessage.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>
