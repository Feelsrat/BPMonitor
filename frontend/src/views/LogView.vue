<template>
  <div class="grid gap-6 lg:grid-cols-5">
    <div class="lg:col-span-2">
      <BaseCard title="New reading">
        <EntryForm :save="save" autofocus />
        <BaseAlert v-if="saved" type="success" class="mt-4">
          Saved {{ formatBP(saved.systolic, saved.diastolic) }} mmHg, {{ saved.pulse }} bpm.
        </BaseAlert>
      </BaseCard>
    </div>

    <div class="space-y-6 lg:col-span-3">
      <div class="grid grid-cols-3 gap-3">
        <StatTile label="7-day average" :value="formatBP(week.systolic.avg, week.diastolic.avg)" unit="mmHg" />
        <StatTile label="Pulse" :value="week.pulse.avg ?? '-'" unit="bpm" />
        <StatTile label="Readings" :value="week.count" :detail="`on ${week.days} day${week.days === 1 ? '' : 's'}`" />
      </div>

      <EntryActions ref="actions" />
      <BaseCard title="Last 7 days" flush>
        <template #actions>
          <RouterLink to="/history" class="text-sm font-medium text-slate-600 hover:text-slate-900">All readings →</RouterLink>
        </template>
        <div class="mt-3">
          <BaseAlert v-if="error" type="error" class="mx-4 mb-4">{{ error }}</BaseAlert>
          <EntryList :entries="recent" editable @edit="(entry) => actions.edit(entry)" />
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEntries } from '../composables/useEntries'
import { resolveRange, inRange, summarize, formatBP } from '../utils/bp'
import EntryForm from '../components/EntryForm.vue'
import EntryList from '../components/EntryList.vue'
import EntryActions from '../components/EntryActions.vue'
import StatTile from '../components/StatTile.vue'

const { entries, error, add } = useEntries()
const actions = ref(null)
const saved = ref(null)

const recent = computed(() => inRange(entries.value, resolveRange({ preset: '7d' })))
const week = computed(() => summarize(recent.value))

let hideTimer
const save = async (data) => {
  saved.value = await add(data)
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => (saved.value = null), 4000)
}
</script>
