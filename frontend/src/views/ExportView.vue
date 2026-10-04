<template>
  <div class="space-y-6">
    <RangePicker v-model="range" />

    <div class="grid gap-6 lg:grid-cols-5">
      <BaseCard title="PDF report" description="A summary with charts and a list of every reading, ready to send to your doctor." class="lg:col-span-3">
        <div class="space-y-4">
          <BaseInput v-model="name" label="Name on report" placeholder="Optional" autocomplete="name" />

          <fieldset class="space-y-2">
            <legend class="mb-1.5 text-sm font-medium text-slate-700">Include</legend>
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="includeReadings" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              List of all readings
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-700" :class="{ 'opacity-50': !includeReadings }">
              <input v-model="includeNotes" type="checkbox" :disabled="!includeReadings" class="h-4 w-4 rounded border-slate-300" />
              Notes
            </label>
          </fieldset>

          <p class="text-sm text-slate-500">
            {{ filtered.length }} reading{{ filtered.length === 1 ? '' : 's' }}, {{ describeSpan(filtered) }}
          </p>

          <BaseAlert v-if="pdfError" type="error">{{ pdfError }}</BaseAlert>

          <BaseButton :disabled="!filtered.length" :loading="generating" @click="downloadPDF">
            Download PDF
          </BaseButton>
        </div>
      </BaseCard>

      <BaseCard title="CSV" description="Raw readings for spreadsheets or as a backup. Can be imported again." class="lg:col-span-2">
        <BaseButton variant="secondary" :disabled="!filtered.length" @click="downloadCSVFile">
          Download CSV
        </BaseButton>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useEntries } from '../composables/useEntries'
import { resolveRange, inRange, describeSpan, downloadCSV, RANGE_PRESETS } from '../utils/bp'
import RangePicker from '../components/RangePicker.vue'

const NAME_KEY = 'reportName'
const storage = {
  get: () => { try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' } },
  set: (value) => { try { localStorage.setItem(NAME_KEY, value) } catch { /* not persisted */ } },
}

const { entries } = useEntries()
const range = ref({ preset: '90d', from: '', to: '' })
const name = ref(storage.get())
const includeReadings = ref(true)
const includeNotes = ref(true)
const generating = ref(false)
const pdfError = ref('')

watch(name, storage.set)

const bounds = computed(() => resolveRange(range.value))
const filtered = computed(() => inRange(entries.value, bounds.value))

const rangeLabel = computed(() => {
  const preset = RANGE_PRESETS.find(p => p.id === range.value.preset)
  if (preset?.days) return `Last ${preset.label}`
  return preset?.id === 'all' ? 'All readings' : 'Custom range'
})

const fileSuffix = () => `${new Date().toISOString().slice(0, 10)}_${rangeLabel.value.replace(/\s+/g, '-')}`

const downloadPDF = async () => {
  generating.value = true
  pdfError.value = ''
  try {
    // Loaded on demand: the PDF library is large
    const { generateReport } = await import('../utils/report')
    generateReport({
      entries: filtered.value,
      range: bounds.value,
      rangeLabel: rangeLabel.value,
      name: name.value.trim(),
      includeReadings: includeReadings.value,
      includeNotes: includeNotes.value,
      filename: `BP-report_${fileSuffix()}.pdf`,
    })
  } catch (err) {
    console.error(err)
    pdfError.value = 'Could not create the PDF.'
  } finally {
    generating.value = false
  }
}

const downloadCSVFile = () => downloadCSV(filtered.value, `BP-readings_${fileSuffix()}.csv`)
</script>
