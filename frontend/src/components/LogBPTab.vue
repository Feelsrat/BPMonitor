<template>
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Log Blood Pressure</h2>
    
    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="systolic" class="block text-sm font-medium text-gray-700 mb-2">
            Systolic (mmHg)
          </label>
          <input
            id="systolic"
            v-model.number="form.systolic"
            type="number"
            min="50"
            max="250"
            placeholder="120"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label for="diastolic" class="block text-sm font-medium text-gray-700 mb-2">
            Diastolic (mmHg)
          </label>
          <input
            id="diastolic"
            v-model.number="form.diastolic"
            type="number"
            min="30"
            max="150"
            placeholder="80"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label for="pulse" class="block text-sm font-medium text-gray-700 mb-2">
            Pulse (BPM)
          </label>
          <input
            id="pulse"
            v-model.number="form.pulse"
            type="number"
            min="30"
            max="200"
            placeholder="72"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          v-model="form.notes"
          placeholder="e.g., after exercise, feeling stressed, etc."
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ loading ? 'Saving...' : 'Log Entry' }}
        </button>
        <button
          type="button"
          @click="resetForm"
          class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
        >
          Clear
        </button>
      </div>
      
      <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { createEntry } from '../services/api'

export default {
  name: 'LogBPTab',
  emits: ['entry-created'],
  setup(_, { emit }) {
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
        
        successMessage.value = '✓ Blood pressure logged successfully!'
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
    
    return {
      form,
      loading,
      successMessage,
      errorMessage,
      resetForm,
      handleSubmit,
    }
  },
}
</script>
