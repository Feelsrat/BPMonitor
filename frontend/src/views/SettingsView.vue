<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <BaseCard title="Share link" description="Anyone with this link can see your readings (without notes). They cannot change anything.">
      <div class="flex gap-2">
        <input :value="publicUrl" readonly aria-label="Share link" class="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700" @focus="$event.target.select()" />
        <BaseButton variant="secondary" @click="copyLink">{{ copied ? 'Copied' : 'Copy' }}</BaseButton>
      </div>
      <a :href="publicUrl" target="_blank" rel="noopener" class="mt-3 inline-block text-sm font-medium text-slate-600 hover:text-slate-900">Open shared page ↗</a>
    </BaseCard>

    <BaseCard title="Import readings" description="CSV with a header row (Systolic, Diastolic, Pulse, Timestamp, optional Notes), or a JSON backup.">
      <div class="space-y-4">
        <input ref="fileInput" type="file" accept=".csv,.json" class="block w-full text-sm text-slate-600 file:mr-3 file:h-9 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-50" @change="onFileSelected" />

        <fieldset class="space-y-2">
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input v-model="importMode" type="radio" value="merge" class="mt-0.5" />
            <span>Add to existing readings <span class="block text-xs text-slate-500">Readings that already exist are skipped</span></span>
          </label>
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input v-model="importMode" type="radio" value="replace" class="mt-0.5" />
            <span>Replace all readings <span class="block text-xs text-slate-500">Deletes everything currently stored first</span></span>
          </label>
        </fieldset>

        <BaseAlert v-if="importResult" type="success">{{ importResult }}</BaseAlert>
        <BaseAlert v-if="importError" type="error">{{ importError }}</BaseAlert>

        <BaseButton :disabled="!selectedFile" :loading="importing" @click="importFile">Import</BaseButton>
      </div>
    </BaseCard>

    <BaseCard title="Account">
      <BaseButton variant="secondary" @click="setAuthToken(null)">Log out</BaseButton>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { importData, setAuthToken, errorMessage } from '../services/api'
import { useEntries } from '../composables/useEntries'
import { parseImportFile } from '../utils/importFile'

const { reload } = useEntries()

const publicUrl = `${window.location.origin}/public`
const copied = ref(false)

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard unavailable: the field is selectable instead
  }
}

const fileInput = ref(null)
const selectedFile = ref(null)
const importMode = ref('merge')
const importing = ref(false)
const importResult = ref('')
const importError = ref('')

const onFileSelected = (event) => {
  selectedFile.value = event.target.files?.[0] ?? null
  importResult.value = ''
  importError.value = ''
}

const importFile = async () => {
  importError.value = ''
  importResult.value = ''
  if (importMode.value === 'replace' && !confirm('Delete all stored readings and replace them with this file?')) return

  importing.value = true
  try {
    const entries = parseImportFile(selectedFile.value.name, await selectedFile.value.text())
    const { data } = await importData(entries, importMode.value)
    importResult.value = data.message
    selectedFile.value = null
    fileInput.value.value = ''
    importMode.value = 'merge'
    await reload()
  } catch (err) {
    importError.value = errorMessage(err, err.message || 'Import failed.')
  } finally {
    importing.value = false
  }
}
</script>
