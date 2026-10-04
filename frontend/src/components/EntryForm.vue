<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="grid grid-cols-3 items-end gap-3">
      <BaseInput v-model="form.systolic" type="number" inputmode="numeric" label="Systolic" unit="mmHg" placeholder="120" min="40" max="300" required :autofocus="autofocus" />
      <BaseInput v-model="form.diastolic" type="number" inputmode="numeric" label="Diastolic" unit="mmHg" placeholder="80" min="20" max="200" required />
      <BaseInput v-model="form.pulse" type="number" inputmode="numeric" label="Pulse" unit="bpm" placeholder="70" min="20" max="250" required />
    </div>

    <BaseInput v-model="form.time" type="datetime-local" label="Taken at" :max="maxTime" required />

    <div>
      <BaseTextarea v-model="form.notes" label="Notes" placeholder="Optional" />
      <div class="mt-2 flex flex-wrap gap-1.5">
        <button
          v-for="template in noteTemplates"
          :key="template"
          type="button"
          class="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          @click="addNote(template)"
        >
          {{ template }}
        </button>
      </div>
    </div>

    <BaseAlert v-if="error" type="error">{{ error }}</BaseAlert>

    <div class="flex flex-wrap gap-2">
      <BaseButton type="submit" :loading="saving" :full-width="!$slots.secondary">{{ submitLabel }}</BaseButton>
      <slot name="secondary" />
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { errorMessage } from '../services/api'
import { toLocalInput } from '../utils/bp'

const props = defineProps({
  // Existing reading to edit; omit to log a new one
  entry: { type: Object, default: null },
  // async (payload) => void
  save: { type: Function, required: true },
  submitLabel: { type: String, default: 'Save reading' },
  autofocus: { type: Boolean, default: false },
})

const noteTemplates = [
  'Just woke up',
  'Before medication',
  'After medication',
  'After exercise',
  'Stressed',
  'Relaxed',
  'After meal',
  'Before bed',
]

const initial = () => ({
  systolic: props.entry?.systolic ?? '',
  diastolic: props.entry?.diastolic ?? '',
  pulse: props.entry?.pulse ?? '',
  notes: props.entry?.notes ?? '',
  time: toLocalInput(props.entry?.timestamp ?? new Date()),
})

const form = ref(initial())
const saving = ref(false)
const error = ref('')
const maxTime = toLocalInput(Date.now() + 24 * 60 * 60 * 1000)

const addNote = (note) => {
  const current = form.value.notes.trim()
  form.value.notes = current ? `${current}, ${note.toLowerCase()}` : note
}

const submit = async () => {
  saving.value = true
  error.value = ''
  try {
    const { time, ...reading } = form.value
    await props.save({ ...reading, timestamp: new Date(time).toISOString() })
    if (!props.entry) form.value = initial()
  } catch (err) {
    error.value = errorMessage(err, 'Could not save the reading.')
  } finally {
    saving.value = false
  }
}
</script>
