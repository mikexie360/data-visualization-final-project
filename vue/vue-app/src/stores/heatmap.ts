import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Team } from '../types'

export const useHeatmapStore = defineStore('heatmap', () => {
  // State
  const isReady = ref(false)
  const teams = ref<Array<{ team_id: number; name: string }>>([])
  const probMatrix = ref<Record<string, Record<string, number>>>({})

  // Actions
  function setData(teamsData: Array<{ team_id: number; name: string }>, probMatrixData: Record<string, Record<string, number>>) {
    teams.value = teamsData
    probMatrix.value = probMatrixData
    isReady.value = true
  }

  function reset() {
    isReady.value = false
    teams.value = []
    probMatrix.value = {}
  }

  return {
    // State
    isReady,
    teams,
    probMatrix,
    
    // Actions
    setData,
    reset
  }
})
