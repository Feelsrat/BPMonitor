<template>
  <!-- Edit dialog for a reading (with delete); opened through the exposed edit() -->
  <div
    v-if="editing"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
    @click.self="editing = null"
    @keydown.esc="editing = null"
  >
    <div role="dialog" aria-modal="true" aria-labelledby="edit-title" class="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
      <h2 id="edit-title" class="mb-4 text-lg font-semibold text-slate-900">Edit reading</h2>
      <BaseAlert v-if="deleteError" type="error" class="mb-4">{{ deleteError }}</BaseAlert>
      <EntryForm :entry="editing" :save="saveEdit" submit-label="Save changes" autofocus>
        <template #secondary>
          <BaseButton variant="secondary" @click="editing = null">Cancel</BaseButton>
          <BaseButton variant="danger" class="ml-auto" @click="confirmDelete">Delete</BaseButton>
        </template>
      </EntryForm>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEntries } from '../composables/useEntries'
import { errorMessage } from '../services/api'
import { formatBP, formatDateTime } from '../utils/bp'
import EntryForm from './EntryForm.vue'

const { update, remove } = useEntries()
const editing = ref(null)
const deleteError = ref('')
const saveEdit = async (data) => {
  await update(editing.value.id, data)
  editing.value = null
}

const edit = (entry) => {
  deleteError.value = ''
  editing.value = entry
}

const confirmDelete = async () => {
  const entry = editing.value
  if (!confirm(`Delete the ${formatBP(entry.systolic, entry.diastolic)} reading from ${formatDateTime(entry.timestamp)}?`)) return
  try {
    await remove(entry.id)
    editing.value = null
  } catch (err) {
    deleteError.value = errorMessage(err, 'Could not delete the reading.')
  }
}

defineExpose({ edit })
</script>
