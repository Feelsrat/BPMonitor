import { ref, watch } from 'vue'
import { getEntries, getPublicEntries, createEntry, updateEntry, deleteEntry, authToken, errorMessage } from '../services/api'
import { timeOf } from '../utils/bp'

function createStore(fetch) {
  const entries = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')

  const sort = () => entries.value.sort((a, b) => timeOf(b) - timeOf(a))

  async function load({ force = false } = {}) {
    if ((loaded.value && !force) || loading.value) return
    loading.value = true
    error.value = ''
    try {
      entries.value = (await fetch()).data
      sort()
      loaded.value = true
    } catch (err) {
      error.value = errorMessage(err, 'Could not load readings.')
    } finally {
      loading.value = false
    }
  }

  return { entries, loaded, loading, error, load, sort }
}

const privateStore = createStore(getEntries)
const publicStore = createStore(getPublicEntries)

// Forget cached readings on logout
watch(authToken, (token) => {
  if (!token) {
    privateStore.entries.value = []
    privateStore.loaded.value = false
  }
})

async function add(data) {
  const { data: entry } = await createEntry(data)
  privateStore.entries.value.push(entry)
  privateStore.sort()
  return entry
}

async function update(id, data) {
  const { data: entry } = await updateEntry(id, data)
  const list = privateStore.entries.value
  list.splice(list.findIndex(e => e.id === id), 1, entry)
  privateStore.sort()
  return entry
}

async function remove(id) {
  await deleteEntry(id)
  privateStore.entries.value = privateStore.entries.value.filter(e => e.id !== id)
}

// Shared, cached readings. The public store holds the notes-free data for /public.
export function useEntries({ publicView = false } = {}) {
  const store = publicView ? publicStore : privateStore
  store.load()
  return { ...store, add, update, remove, reload: () => store.load({ force: true }) }
}
