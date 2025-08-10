<template>
  <div class="min-h-screen surface-ground text-color">
    <Menubar :model="items" class="shadow-1">
      <template #start>
        <div class="flex align-items-center gap-2 px-2">
          <i class="pi pi-sitemap"></i>
          <span class="font-semibold">TI 2025 Visualization</span>
        </div>
      </template>
    </Menubar>

    <div class="p-4">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Menubar from 'primevue/menubar'

const items = ref([
  { label: 'Probability Heat Map', icon: 'pi pi-table', to: { name: 'heatmap' } }, // ✅ use named routes
  { label: 'Simulator', icon: 'pi pi-play', to: { name: 'sim' } },
])
</script>

<style>
.surface-ground { background: var(--p-surface-100); }
</style>
