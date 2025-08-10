import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Team, ProbMatrix, TournamentRun, SimulationStats } from '../types'
import { TournamentSimulator } from '../services/tournamentSimulator'
import { loadTeams, loadProbMatrix } from '../services/loadData'

export const useSimStore = defineStore('sim', () => {
  // State
  const teams = ref<Team[]>([])
  const probMatrix = ref<ProbMatrix>({})
  const simulator = ref<TournamentSimulator | null>(null)
  const currentRun = ref<TournamentRun | null>(null)
  const simulationStats = ref<SimulationStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isReady = computed(() => simulator.value !== null)
  const hasCurrentRun = computed(() => currentRun.value !== null)
  const hasStats = computed(() => simulationStats.value !== null)

  // Actions
  async function initialize() {
    try {
      isLoading.value = true
      error.value = null
      
      const [teamsData, matrixData] = await Promise.all([
        loadTeams(),
        loadProbMatrix()
      ])
      
      teams.value = teamsData
      probMatrix.value = matrixData
      simulator.value = new TournamentSimulator(teamsData, matrixData)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize simulator'
    } finally {
      isLoading.value = false
    }
  }

  function simulateSingleRun(
    randomSeeding: boolean = true,
    pairingStyle: '1v16' | 'adjacent' = '1v16',
    seedOrder?: number[]
  ) {
    if (!simulator.value) {
      throw new Error('Simulator not initialized')
    }

    try {
      currentRun.value = simulator.value.simulateOnce(randomSeeding, pairingStyle, seedOrder)
      return currentRun.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Simulation failed'
      throw err
    }
  }

  function runMonteCarlo(
    N: number = 100,
    randomSeeding: boolean = true,
    pairingStyle: '1v16' | 'adjacent' = '1v16',
    seedOrder?: number[]
  ) {
    if (!simulator.value) {
      throw new Error('Simulator not initialized')
    }

    try {
      isLoading.value = true
      error.value = null
      
      simulationStats.value = simulator.value.monteCarlo(N, randomSeeding, pairingStyle, seedOrder)
      return simulationStats.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Monte Carlo simulation failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearCurrentRun() {
    currentRun.value = null
  }

  function clearStats() {
    simulationStats.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    teams,
    probMatrix,
    simulator,
    currentRun,
    simulationStats,
    isLoading,
    error,
    
    // Computed
    isReady,
    hasCurrentRun,
    hasStats,
    
    // Actions
    initialize,
    simulateSingleRun,
    runMonteCarlo,
    clearCurrentRun,
    clearStats,
    clearError
  }
})
