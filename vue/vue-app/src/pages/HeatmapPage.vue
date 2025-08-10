<template>
  <div class="flex flex-column gap-4">
    <div class="flex align-items-center gap-3">
      <Button label="Load data" icon="pi pi-download" @click="load" :loading="loading" />
      <span v-if="store.loaded" class="text-sm text-500">Loaded {{ store.teams.length }} teams</span>
    </div>

    <div v-if="store.loaded" class="card">
      <h3 class="mt-0">P(Team A beats Team B)</h3>
      <div class="overflow-auto">
        <DataTable :value="rows" scrollable scrollHeight="60vh" size="small">
          <Column field="team" header="Team A" frozen />
          <Column
            v-for="col in cols"
            :key="col.key"
            :field="col.key"
            :header="col.label"
            :body="(r:any) => formatCell(r[col.key])"
            style="min-width: 6rem"
          />
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useSimStore } from '@/stores/sim'
import { loadAll } from '@/services/loadData'

const store = useSimStore()
const loading = ref(false)

async function load() {
  try {
    loading.value = true
    const { teams, matrix } = await loadAll()
    store.setData(teams, matrix)
  } finally {
    loading.value = false
  }
}

const cols = computed(() => {
  if (!store.loaded) return []
  return store.teams.map(t => ({
    key: String(t.team_id),
    label: t.name,
  }))
})

const rows = computed(() => {
  if (!store.loaded) return []
  return store.teams.map(a => {
    const row: Record<string, any> = { team: a.name }
    for (const b of store.teams) {
      const p = store.probMatrix[a.team_id]?.[b.team_id] ?? 0.5
      row[String(b.team_id)] = p
    }
    return row
  })
})

function formatCell(val: number) {
  return (val * 100).toFixed(1) + '%'
}
</script>
