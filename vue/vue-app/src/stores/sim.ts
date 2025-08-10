import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TournamentSimulator, type SimulationConfig, type ProgressCallback } from '../services/tournamentSimulator'
import type { Team, ProbMatrix, SimulationStats, TournamentRun } from '../types'

export const useSimStore = defineStore('sim', () => {
  // Data loading state
  const isDataLoaded = ref(false)
  const teams = ref<Team[]>([])
  const probMatrix = ref<ProbMatrix>({})

  // Simulation state
  const isRunning = ref(false)
  const results = ref<SimulationStats | null>(null)
  const singleRun = ref<TournamentRun | null>(null)

  // Progress tracking
  const progress = ref({
    current: 0,
    total: 0,
    stage: '',
    isMonteCarlo: false
  })

  // Configuration state
  const config = ref<SimulationConfig>({
    random_seeding: true,
    pairing_style: '1v16',
    num_simulations: 100,
    verbose: false
  })

  const seedingType = ref('random')
  const rngSeed = ref(42)
  const customSeedOrder = ref<Team[]>([])
  const customPairingStyle = ref<'1v16' | 'adjacent'>('1v16')
  const draggedIndex = ref<number | null>(null)

  // Simulator instance
  const simulator = ref<TournamentSimulator | null>(null)

  // Computed
  const playoffStages = computed(() => ({
    'UB_QF': { name: 'Upper Bracket Quarterfinals' },
    'UB_SF': { name: 'Upper Bracket Semifinals' },
    'UB_Final': { name: 'Upper Bracket Final' },
    'LB_R1': { name: 'Lower Bracket Round 1' },
    'LB_R2': { name: 'Lower Bracket Round 2' },
    'LB_QF': { name: 'Lower Bracket Quarterfinal' },
    'LB_Final': { name: 'Lower Bracket Final' },
    'GF': { name: 'Grand Final' }
  }))

  // Actions
  function setData(teamsData: Team[], probMatrixData: ProbMatrix) {
    teams.value = teamsData
    probMatrix.value = probMatrixData
    isDataLoaded.value = true
    
    // Initialize custom seed order with all teams
    customSeedOrder.value = [...teamsData]
  }

  function resetCustomSeedOrder() {
    customSeedOrder.value = [...teams.value]
  }

  function updateConfig() {
    if (!teams.value.length) return

    let randomSeeding = true
    let pairingStyle: '1v16' | 'adjacent' = '1v16'
    let seedOrder: number[] | undefined = undefined

    if (seedingType.value === 'seeded_1v16') {
      randomSeeding = false
      pairingStyle = '1v16'
      // Use teams sorted by their seed value for seeded options
      seedOrder = [...teams.value]
        .sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0))
        .map(t => t.team_id)
    } else if (seedingType.value === 'seeded_adjacent') {
      randomSeeding = false
      pairingStyle = 'adjacent'
      // Use teams sorted by their seed value for seeded options
      seedOrder = [...teams.value]
        .sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0))
        .map(t => t.team_id)
    } else if (seedingType.value === 'random_1v16') {
      randomSeeding = true
      pairingStyle = '1v16'
    } else if (seedingType.value === 'random_adjacent') {
      randomSeeding = true
      pairingStyle = 'adjacent'
    } else if (seedingType.value === 'custom') {
      randomSeeding = false
      pairingStyle = customPairingStyle.value as '1v16' | 'adjacent'
      seedOrder = customSeedOrder.value.map(t => t.team_id)
    }

    config.value = {
      random_seeding: randomSeeding,
      pairing_style: pairingStyle,
      num_simulations: config.value.num_simulations,
      verbose: false,
      seed_order: seedOrder
    }
  }

  async function simulateSingleRun(
    config: SimulationConfig,
    onProgress?: ProgressCallback
  ): Promise<TournamentRun> {
    if (!simulator.value) {
      simulator.value = new TournamentSimulator(teams.value, probMatrix.value, rngSeed.value)
    }
    const [champion, runLog] = await simulator.value.simulateOnce(config, onProgress)
    singleRun.value = runLog
    return runLog
  }

  async function runMonteCarlo(
    config: SimulationConfig,
    onProgress?: ProgressCallback
  ): Promise<SimulationStats> {
    if (!simulator.value) {
      simulator.value = new TournamentSimulator(teams.value, probMatrix.value, rngSeed.value)
    }
    const [titleOdds, logs, stats] = await simulator.value.monteCarlo(config, onProgress)
    results.value = stats
    return stats
  }

  // Helper methods for displaying all teams
  function getAllTeamsForBucket(bucketKey: string) {
    if (!results.value?.swiss_final_probs[bucketKey]) {
      return teams.value.map(team => ({
        team_id: team.team_id,
        team: team.name,
        prob: 0
      }))
    }
    
    const bucketTeams = results.value.swiss_final_probs[bucketKey]
    const allTeams = teams.value.map(team => {
      const existingTeam = bucketTeams.find(t => t.team_id === team.team_id)
      return existingTeam || {
        team_id: team.team_id,
        team: team.name,
        prob: 0
      }
    })
    
    return allTeams.sort((a, b) => b.prob - a.prob)
  }

  function getAllTeamsForStage(stageKey: string) {
    if (!results.value?.stage_probs[stageKey]) {
      return teams.value.map(team => ({
        team_id: team.team_id,
        team: team.name,
        prob: 0
      }))
    }
    
    const stageTeams = results.value.stage_probs[stageKey]
    const allTeams = teams.value.map(team => {
      const existingTeam = stageTeams.find(t => t.team_id === team.team_id)
      return existingTeam || {
        team_id: team.team_id,
        team: team.name,
        prob: 0
      }
    })
    
    return allTeams.sort((a, b) => b.prob - a.prob)
  }

  function getAllTeamsForElimination(type: 'participation' | 'advancement') {
    const sourceArray = type === 'participation' 
      ? results.value?.elim_participation 
      : results.value?.elim_advancers
    
    if (!sourceArray) {
      return teams.value.map(team => ({
        team_id: team.team_id,
        team: team.name,
        prob: 0
      }))
    }
    
    const allTeams = teams.value.map(team => {
      const existingTeam = sourceArray.find(t => t.team_id === team.team_id)
      return existingTeam || {
        team_id: team.team_id,
        team: team.name,
        prob: 0
      }
    })
    
    return allTeams.sort((a, b) => b.prob - a.prob)
  }

  function getAllTeamsForChampionship() {
    if (!results.value?.title_odds) {
      return teams.value.map(team => ({
        team_id: team.team_id,
        team: team.name,
        win_prob: 0
      }))
    }
    
    const allTeams = teams.value.map(team => {
      const existingTeam = results.value!.title_odds.find(t => t.team_id === team.team_id)
      return existingTeam || {
        team_id: team.team_id,
        team: team.name,
        win_prob: 0
      }
    })
    
    return allTeams.sort((a, b) => b.win_prob - a.win_prob)
  }

  return {
    // State
    isDataLoaded,
    teams,
    probMatrix,
    isRunning,
    results,
    singleRun,
    progress,
    config,
    seedingType,
    rngSeed,
    customSeedOrder,
    customPairingStyle,
    draggedIndex,
    playoffStages,
    
    // Actions
    setData,
    resetCustomSeedOrder,
    updateConfig,
    simulateSingleRun,
    runMonteCarlo,
    
    // Helper methods
    getAllTeamsForBucket,
    getAllTeamsForStage,
    getAllTeamsForElimination,
    getAllTeamsForChampionship
  }
})
