<template>
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Log Blood Pressure</h2>
    
    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseInput
          id="systolic"
          v-model="form.systolic"
          type="number"
          label="Systolic (mmHg)"
          placeholder="120"
          :min="50"
          :max="250"
          required
        />
        
        <BaseInput
          id="diastolic"
          v-model="form.diastolic"
          type="number"
          label="Diastolic (mmHg)"
          placeholder="80"
          :min="30"
          :max="150"
          required
        />
        
        <BaseInput
          id="pulse"
          v-model="form.pulse"
          type="number"
          label="Pulse (BPM)"
          placeholder="72"
          :min="30"
          :max="200"
          required
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        
        <!-- Quick note templates -->
        <div class="flex flex-wrap gap-2 mb-2">
          <BaseButton
            v-for="template in noteTemplates"
            :key="template"
            variant="small"
            type="button"
            @click="form.notes = template"
          >
            {{ template }}
          </BaseButton>
        </div>
        
        <BaseTextarea
          id="notes"
          v-model="form.notes"
          placeholder="Type custom note or click a template above"
          :rows="3"
        />
      </div>
      
      <div class="flex flex-col sm:flex-row gap-3 pt-4">
        <BaseButton
          type="submit"
          variant="primary"
          :loading="loading"
          full-width
        >
          {{ loading ? 'Saving...' : 'Log Entry' }}
        </BaseButton>
        <BaseButton
          type="button"
          variant="secondary"
          @click="resetForm"
          full-width
        >
          Clear
        </BaseButton>
      </div>
      
      <BaseAlert v-if="successMessage" type="success">
        {{ successMessage }}
      </BaseAlert>
      
      <BaseAlert v-if="errorMessage" type="error">
        {{ errorMessage }}
      </BaseAlert>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createEntry } from '../services/api'

const emit = defineEmits(['entry-created'])

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

const form = ref({
  systolic: '',
  diastolic: '',
  pulse: '',
  notes: '',
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const resetForm = () => {
  form.value = {
    systolic: '',
    diastolic: '',
    pulse: '',
    notes: '',
  }
  successMessage.value = ''
  errorMessage.value = ''
}

const handleSubmit = async () => {
  if (!form.value.systolic || !form.value.diastolic || !form.value.pulse) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    await createEntry({
      systolic: form.value.systolic,
      diastolic: form.value.diastolic,
      pulse: form.value.pulse,
      notes: form.value.notes || null,
    })
    
    successMessage.value = 'Blood pressure logged successfully!'
    resetForm()
    
    // Emit event so parent can refresh charts
    emit('entry-created')
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to log entry. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
