<template>
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Log Blood Pressure</h2>

    <BaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput v-model="form.systolic" type="number" label="Systolic (mmHg)" placeholder="120" :min="40" :max="300" required />
          <BaseInput v-model="form.diastolic" type="number" label="Diastolic (mmHg)" placeholder="80" :min="20" :max="200" required />
          <BaseInput v-model="form.pulse" type="number" label="Pulse (BPM)" placeholder="72" :min="20" :max="250" required />
        </div>

        <div>
          <p class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</p>
          <div class="flex flex-wrap gap-2 mb-2">
            <BaseButton
              v-for="template in noteTemplates"
              :key="template"
              variant="small"
              @click="form.notes = template"
            >
              {{ template }}
            </BaseButton>
          </div>
          <BaseTextarea v-model="form.notes" placeholder="Type custom note or click a template above" />
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          <BaseButton type="submit" variant="primary" :loading="loading" full-width>
            {{ loading ? 'Saving...' : 'Log Entry' }}
          </BaseButton>
          <BaseButton variant="secondary" @click="resetForm" full-width>
            Clear
          </BaseButton>
        </div>

        <BaseAlert v-if="errorMessage" type="error">
          {{ errorMessage }}
        </BaseAlert>
      </form>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createEntry, errorMessage as apiError } from '../services/api'

const emit = defineEmits(['saved'])

const noteTemplates = [
  'Just woke up',
  'Before medication',
  'After medication',
  'After exercise',
  'Feeling stressed',
  'Feeling relaxed',
  'After meal',
  'Before bed',
]

const emptyForm = () => ({ systolic: '', diastolic: '', pulse: '', notes: '' })

const form = ref(emptyForm())
const loading = ref(false)
const errorMessage = ref('')

const resetForm = () => {
  form.value = emptyForm()
  errorMessage.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await createEntry(form.value)
    resetForm()
    emit('saved')
  } catch (err) {
    errorMessage.value = apiError(err, 'Failed to log entry. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>
