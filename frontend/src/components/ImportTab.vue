<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">📥 Import Data</h2>
      
      <div class="space-y-4">
        <!-- File Selection -->
        <div class="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 transition">
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.json"
            @change="onFileSelected"
            class="hidden"
          />
          <button
            @click="$refs.fileInput.click()"
            class="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Click to select CSV or JSON file
          </button>
          <p v-if="selectedFile" class="text-green-600 mt-2">
            ✓ Selected: {{ selectedFile.name }}
          </p>
        </div>

        <!-- Import Mode Selection -->
        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer" :class="importMode === 'merge' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
            <input
              type="radio"
              v-model="importMode"
              value="merge"
              class="mr-3"
            />
            <div>
              <div class="font-semibold text-gray-800">Merge Data</div>
              <div class="text-sm text-gray-600">Add to existing entries (default)</div>
            </div>
          </label>
          
          <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer" :class="importMode === 'replace' ? 'border-red-500 bg-red-50' : 'border-gray-200'">
            <input
              type="radio"
              v-model="importMode"
              value="replace"
              class="mr-3"
            />
            <div>
              <div class="font-semibold text-gray-800">Replace Data</div>
              <div class="text-sm text-gray-600">Replace all entries ⚠️</div>
            </div>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            @click="importData"
            :disabled="!selectedFile || isImporting"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {{ isImporting ? 'Importing...' : '📤 Import' }}
          </button>
          <button
            @click="resetForm"
            class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Reset
          </button>
        </div>

        <!-- Messages -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ✗ {{ errorMessage }}
        </div>

        <!-- Format Info -->
        <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
          <div class="font-semibold mb-2">📋 Supported Formats:</div>
          <div class="space-y-1">
            <div><strong>CSV:</strong> Systolic,Diastolic,Pulse,Notes,Timestamp</div>
            <div><strong>JSON:</strong> Array of {systolic, diastolic, pulse, notes, timestamp} objects</div>
            <div class="text-gray-600 mt-2">Example CSV row: 120,80,72,Morning reading,2024-01-15T08:30:00Z</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { importData } from '../services/api'

export default {
  name: 'ImportTab',
  emits: ['import-complete'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const importMode = ref('merge')
    const isImporting = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    const onFileSelected = (event) => {
      const file = event.target.files?.[0]
      if (file) {
        selectedFile.value = file
        errorMessage.value = ''
        successMessage.value = ''
      }
    }

    const parseCSV = (csvText) => {
      const lines = csvText.trim().split('\n')
      const header = lines[0].toLowerCase()
      const entries = []

      // Check if header exists
      if (!header.includes('systolic')) {
        throw new Error('CSV header must contain: Systolic,Diastolic,Pulse,Notes,Timestamp')
      }

      // Proper CSV parser that handles quoted fields with commas
      const parseCSVLine = (line) => {
        const values = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim()) // Add the last value
        
        return values
      }

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = parseCSVLine(lines[i])
        if (values.length < 5) continue

        entries.push({
          systolic: parseInt(values[0]),
          diastolic: parseInt(values[1]),
          pulse: parseInt(values[2]),
          notes: values[3]?.replace(/^"|"$/g, '') || '',
          timestamp: values[4]?.trim() || new Date().toISOString()
        })
      }

      return entries
    }

    const parseJSON = (jsonText) => {
      const data = JSON.parse(jsonText)
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of entries')
      }

      return data.map(entry => ({
        systolic: parseInt(entry.systolic),
        diastolic: parseInt(entry.diastolic),
        pulse: parseInt(entry.pulse),
        notes: entry.notes || '',
        timestamp: entry.timestamp || new Date().toISOString()
      }))
    }

    const importFileData = async () => {
      if (!selectedFile.value) {
        errorMessage.value = 'Please select a file'
        return
      }

      isImporting.value = true
      errorMessage.value = ''
      successMessage.value = ''

      try {
        const fileContent = await selectedFile.value.text()
        let entries = []

        if (selectedFile.value.name.endsWith('.csv')) {
          entries = parseCSV(fileContent)
        } else if (selectedFile.value.name.endsWith('.json')) {
          entries = parseJSON(fileContent)
        } else {
          throw new Error('Unsupported file format. Use .csv or .json')
        }

        if (entries.length === 0) {
          throw new Error('No valid entries found in file')
        }

        // Call import API
        const response = await importData(entries, importMode.value)

        if (response.data.success) {
          successMessage.value = response.data.message
          resetForm()
          emit('import-complete')
        } else {
          errorMessage.value = response.data.error || 'Import failed'
        }
      } catch (error) {
        errorMessage.value = error.message || 'Failed to import data'
        console.error('Import error:', error)
      } finally {
        isImporting.value = false
      }
    }

    const resetForm = () => {
      selectedFile.value = null
      importMode.value = 'merge'
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    return {
      fileInput,
      selectedFile,
      importMode,
      isImporting,
      successMessage,
      errorMessage,
      onFileSelected,
      importData: importFileData,
      resetForm
    }
  }
}
</script>
