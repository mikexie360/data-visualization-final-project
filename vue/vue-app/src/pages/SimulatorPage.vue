<template>
  <div class="simulator-page">
    <div class="header">
      <h1>Tournament Simulator</h1>
      <p>TI 2025 Swiss + Elimination + Double-Elimination Playoffs</p>
    </div>

    <!-- Configuration Panel -->
    <div class="config-panel">
      <h2>Simulation Parameters</h2>
      <div class="config-grid">
        <div class="config-item">
          <label for="num-simulations">Number of Simulations:</label>
          <input 
            id="num-simulations"
            v-model.number="config.num_simulations" 
            type="number" 
            min="1" 
            max="10000"
            :disabled="isRunning"
          />
        </div>

        <div class="config-item">
          <label for="seeding-type">Round 1 Seeding:</label>
          <select 
            id="seeding-type"
            v-model="seedingType" 
            :disabled="isRunning"
          >
            <option value="random">Random</option>
            <option value="random_1v16">Random (1v16)</option>
            <option value="random_adjacent">Random (Adjacent)</option>
            <option value="seeded_1v16">Seeded (1v16)</option>
            <option value="seeded_adjacent">Seeded (Adjacent)</option>
            <option value="custom">Custom Seeds</option>
          </select>
        </div>

        <div v-if="seedingType === 'custom'" class="config-item">
          <label for="custom-pairing">Custom Seeds Pairing Style:</label>
          <select 
            id="custom-pairing"
            v-model="customPairingStyle" 
            :disabled="isRunning"
          >
            <option value="1v16">1v16 (Strongest vs Weakest)</option>
            <option value="adjacent">Adjacent (Similar Strength)</option>
          </select>
        </div>

        <div v-if="seedingType === 'custom'" class="config-item">
          <label>Custom Team Seeds (Drag to reorder):</label>
          <div class="custom-seeds">
            <div class="custom-seeds-header">
              {{ customPairingStyle === '1v16' ? '1v16 Pairing: Strongest vs Weakest teams' : 'Adjacent Pairing: Similar strength teams' }}
            </div>
            <div 
              v-for="(team, index) in customSeedOrder" 
              :key="team.team_id"
              class="seed-item"
              draggable="true"
              @dragstart="dragStart($event, index)"
              @dragover.prevent
              @drop="drop($event, index)"
            >
              <span class="seed-number">{{ index + 1 }}</span>
              <span class="team-name">{{ team.name }}</span>
            </div>
          </div>
        </div>

        <div class="config-item">
          <label for="rng-seed">RNG Seed:</label>
          <input 
            id="rng-seed"
            v-model.number="rngSeed" 
            type="number" 
            :disabled="isRunning"
          />
        </div>
      </div>

      <div class="config-actions">
        <button 
          @click="runSimulation" 
          :disabled="isRunning || !isDataLoaded"
          class="run-btn"
        >
          {{ isRunning ? 'Running...' : 'Run Simulation' }}
        </button>
        <button 
          @click="runSingleSimulation" 
          :disabled="isRunning || !isDataLoaded"
          class="single-btn"
        >
          Run Single Tournament
        </button>
      </div>
    </div>

         <!-- Loading State -->
     <div v-if="!isDataLoaded" class="loading">
       <div class="spinner"></div>
       <p>Loading tournament data...</p>
     </div>

     <!-- Simulation Progress -->
     <div v-if="isRunning" class="simulation-progress">
       <div class="progress-header">
         <div class="spinner"></div>
         <h3>{{ progress.isMonteCarlo ? 'Running Monte Carlo Simulation' : 'Running Single Tournament' }}</h3>
       </div>
       
       <div class="progress-info">
         <div class="progress-text">
           <span class="current">{{ progress.current }}</span>
           <span class="separator">/</span>
           <span class="total">{{ progress.total }}</span>
           <span class="label">tournaments</span>
         </div>
         
         <div class="progress-bar-container">
           <div class="progress-bar">
             <div 
               class="progress-fill" 
               :style="{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }"
             ></div>
           </div>
           <span class="progress-percentage">
             {{ progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0 }}%
           </span>
         </div>
         
         <div class="current-stage">
           <span class="stage-label">Current Stage:</span>
           <span class="stage-name">{{ progress.stage }}</span>
         </div>
       </div>
     </div>

    <!-- Results -->
    <div v-if="results && !isRunning" class="results">
             <!-- Title Odds -->
       <div class="result-section">
         <h2>🏆 Championship Win Probabilities</h2>
         <div class="odds-table scrollable-table">
           <div class="table-header">
             <span>Rank & Team</span>
             <span>Win Probability</span>
           </div>
           <div 
             v-for="(team, index) in getAllTeamsForChampionship()" 
             :key="team.team_id"
             class="table-row"
           >
             <span class="rank-team">{{ index + 1 }}. {{ team.team }}</span>
             <span class="probability">{{ (team.win_prob * 100).toFixed(2) }}%</span>
           </div>
         </div>
       </div>

      <!-- Swiss Stage Probabilities -->
      <div class="result-section">
        <h2>🇨🇭 Swiss Stage Reach Probabilities</h2>
        <div class="swiss-buckets">
          <div 
            v-for="(bucket, bucketKey) in results.swiss_final_probs" 
            :key="bucketKey"
            class="bucket-section"
          >
            <h3>Final Record: {{ bucketKey }}</h3>
            <div class="odds-table scrollable-table">
              <div class="table-header">
                <span>Team</span>
                <span>Reach Probability</span>
              </div>
              <div 
                v-for="team in getAllTeamsForBucket(bucketKey)" 
                :key="team.team_id"
                class="table-row"
              >
                <span class="team-name">{{ team.team }}</span>
                <span class="probability">{{ (team.prob * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Elimination Round -->
      <div class="result-section">
        <h2>⚔️ Elimination Round Probabilities</h2>
        <div class="elim-section">
          <h3>Participation (Seeds 4-13)</h3>
          <div class="odds-table scrollable-table">
            <div class="table-header">
              <span>Team</span>
              <span>Participation Rate</span>
            </div>
            <div 
              v-for="team in getAllTeamsForElimination('participation')" 
              :key="team.team_id"
              class="table-row"
            >
              <span class="team-name">{{ team.team }}</span>
              <span class="probability">{{ (team.prob * 100).toFixed(2) }}%</span>
            </div>
          </div>

          <h3>Advancement to Playoffs</h3>
          <div class="odds-table scrollable-table">
            <div class="table-header">
              <span>Team</span>
              <span>Advancement Rate</span>
            </div>
            <div 
              v-for="team in getAllTeamsForElimination('advancement')" 
              :key="team.team_id"
              class="table-row"
            >
              <span class="team-name">{{ team.team }}</span>
              <span class="probability">{{ (team.prob * 100).toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Playoff Stages -->
      <div class="result-section">
        <h2>🏅 Playoff Stage Reach Probabilities</h2>
        <div class="playoff-stages">
          <div 
            v-for="(stage, stageKey) in playoffStages" 
            :key="stageKey"
            class="stage-section"
          >
            <h3>{{ stage.name }}</h3>
            <div class="odds-table scrollable-table">
              <div class="table-header">
                <span>Team</span>
                <span>Reach Probability</span>
              </div>
              <div 
                v-for="team in getAllTeamsForStage(stageKey)" 
                :key="team.team_id"
                class="table-row"
              >
                <span class="team-name">{{ team.team }}</span>
                <span class="probability">{{ (team.prob * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Tournament Results -->
    <div v-if="singleRun && !isRunning" class="single-results">
      <h2>🎯 Single Tournament Run</h2>
      <div class="champion">
        <h3>🏆 Champion: {{ singleRun.champion.name }}</h3>
      </div>
      
      <!-- Swiss Results -->
      <div class="swiss-results">
        <h3>🇨🇭 Swiss Stage Results</h3>
        <div 
          v-for="round in singleRun.swiss.rounds" 
          :key="round.round"
          class="round-section"
        >
          <h4>Round {{ round.round }}</h4>
          <div class="buckets">
            <div 
              v-for="(teams, bucket) in round.buckets_names" 
              :key="bucket"
              class="bucket"
            >
              <strong>{{ bucket }}:</strong> {{ teams.join(', ') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Playoff Bracket -->
      <div class="playoff-bracket">
        <h3>🏅 Playoff Bracket</h3>
        <div class="bracket">
          <div class="upper-bracket">
            <h4>Upper Bracket</h4>
            <div class="bracket-rounds">
              <div class="round">
                <h5>Quarterfinals</h5>
                <div 
                  v-for="match in singleRun.playoffs.UB.QF" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team">{{ match.A.name }}</div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team">{{ match.B.name }}</div>
                  <div class="winner">Winner: {{ match.winner.name }}</div>
                </div>
              </div>
              <div class="round">
                <h5>Semifinals</h5>
                <div 
                  v-for="match in singleRun.playoffs.UB.SF" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team">{{ match.A.name }}</div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team">{{ match.B.name }}</div>
                  <div class="winner">Winner: {{ match.winner.name }}</div>
                </div>
              </div>
              <div class="round">
                <h5>Final</h5>
                <div class="match">
                  <div class="team">{{ singleRun.playoffs.UB.Final.A.name }}</div>
                  <div class="score">{{ singleRun.playoffs.UB.Final.final_score[0] }}-{{ singleRun.playoffs.UB.Final.final_score[1] }}</div>
                  <div class="team">{{ singleRun.playoffs.UB.Final.B.name }}</div>
                  <div class="winner">Winner: {{ singleRun.playoffs.UB.Final.winner.name }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="lower-bracket">
            <h4>Lower Bracket</h4>
            <div class="bracket-rounds">
              <div class="round">
                <h5>Round 1</h5>
                <div 
                  v-for="match in singleRun.playoffs.LB.R1" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team">{{ match.A.name }}</div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team">{{ match.B.name }}</div>
                  <div class="winner">Winner: {{ match.winner.name }}</div>
                </div>
              </div>
              <div class="round">
                <h5>Round 2</h5>
                <div 
                  v-for="match in singleRun.playoffs.LB.R2" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team">{{ match.A.name }}</div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team">{{ match.B.name }}</div>
                  <div class="winner">Winner: {{ match.winner.name }}</div>
                </div>
              </div>
              <div class="round">
                <h5>Quarterfinal</h5>
                <div class="match">
                  <div class="team">{{ singleRun.playoffs.LB.QF.A.name }}</div>
                  <div class="score">{{ singleRun.playoffs.LB.QF.final_score[0] }}-{{ singleRun.playoffs.LB.QF.final_score[1] }}</div>
                  <div class="team">{{ singleRun.playoffs.LB.QF.B.name }}</div>
                  <div class="winner">Winner: {{ singleRun.playoffs.LB.QF.winner.name }}</div>
                </div>
              </div>
              <div class="round">
                <h5>Final</h5>
                <div class="match">
                  <div class="team">{{ singleRun.playoffs.LB.Final.A.name }}</div>
                  <div class="score">{{ singleRun.playoffs.LB.Final.final_score[0] }}-{{ singleRun.playoffs.LB.Final.final_score[1] }}</div>
                  <div class="team">{{ singleRun.playoffs.LB.Final.B.name }}</div>
                  <div class="winner">Winner: {{ singleRun.playoffs.LB.Final.winner.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grand-final">
          <h4>Grand Final</h4>
          <div class="match">
            <div class="team">{{ singleRun.playoffs.GF.A.name }}</div>
            <div class="score">{{ singleRun.playoffs.GF.final_score[0] }}-{{ singleRun.playoffs.GF.final_score[1] }}</div>
            <div class="team">{{ singleRun.playoffs.GF.B.name }}</div>
            <div class="winner">🏆 Champion: {{ singleRun.playoffs.GF.winner.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { TournamentSimulator, type SimulationConfig, type SimulationStats, type TournamentRun } from '@/services/tournamentSimulator'
import { loadTeams, loadProbMatrix } from '@/services/loadData'
import type { Team, ProbMatrix } from '@/types'

// State
const isDataLoaded = ref(false)
const isRunning = ref(false)
const teams = ref<Team[]>([])
const probMatrix = ref<ProbMatrix>({})
const results = ref<SimulationStats | null>(null)
const singleRun = ref<TournamentRun | null>(null)

// Progress tracking
const progress = ref({
  current: 0,
  total: 0,
  stage: '',
  isMonteCarlo: false
})

// Configuration
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

// Methods
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

// Methods
async function loadData() {
  try {
    const [teamsData, probMatrixData] = await Promise.all([
      loadTeams(),
      loadProbMatrix()
    ])
    teams.value = teamsData
    probMatrix.value = probMatrixData
    customSeedOrder.value = [...teamsData] // Initialize custom seed order
    isDataLoaded.value = true
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

function updateConfig() {
  // Determine seeding type and pairing style
  if (seedingType.value === 'random') {
    config.value.random_seeding = true
    config.value.pairing_style = '1v16' // Default for random
  } else if (seedingType.value === 'random_1v16') {
    config.value.random_seeding = true
    config.value.pairing_style = '1v16'
  } else if (seedingType.value === 'random_adjacent') {
    config.value.random_seeding = true
    config.value.pairing_style = 'adjacent'
  } else if (seedingType.value === 'seeded_1v16') {
    config.value.random_seeding = false
    config.value.pairing_style = '1v16'
    config.value.seed_order = teams.value.map(t => t.team_id)
  } else if (seedingType.value === 'seeded_adjacent') {
    config.value.random_seeding = false
    config.value.pairing_style = 'adjacent'
    config.value.seed_order = teams.value.map(t => t.team_id)
  } else if (seedingType.value === 'custom') {
    config.value.random_seeding = false
    config.value.pairing_style = customPairingStyle.value
    config.value.seed_order = customSeedOrder.value.map(t => t.team_id)
  }
}

function dragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function drop(event: DragEvent, index: number) {
  event.preventDefault()
  if (draggedIndex.value === null) return
  
  const items = [...customSeedOrder.value]
  const draggedItem = items[draggedIndex.value]
  items.splice(draggedIndex.value, 1)
  items.splice(index, 0, draggedItem)
  
  customSeedOrder.value = items
  draggedIndex.value = null
}

async function runSimulation() {
  if (!isDataLoaded.value) return
  
  isRunning.value = true
  results.value = null
  singleRun.value = null
  
  // Initialize progress tracking
  progress.value = {
    current: 0,
    total: config.value.num_simulations,
    stage: 'Initializing...',
    isMonteCarlo: true
  }
  
  try {
    updateConfig()
    const simulator = new TournamentSimulator(teams.value, probMatrix.value, rngSeed.value)
    
    // Create a progress callback
    const onProgress = (current: number, stage: string) => {
      progress.value.current = current
      progress.value.stage = stage
    }
    
    const [titleOdds, logs, stats] = simulator.monteCarlo(config.value, onProgress)
    results.value = stats
  } catch (error) {
    console.error('Simulation error:', error)
  } finally {
    isRunning.value = false
  }
}

async function runSingleSimulation() {
  if (!isDataLoaded.value) return
  
  isRunning.value = true
  results.value = null
  singleRun.value = null
  
  // Initialize progress tracking
  progress.value = {
    current: 0,
    total: 1,
    stage: 'Initializing...',
    isMonteCarlo: false
  }
  
  try {
    updateConfig()
    const simulator = new TournamentSimulator(teams.value, probMatrix.value, rngSeed.value)
    
    // Create a progress callback
    const onProgress = (current: number, stage: string) => {
      progress.value.current = current
      progress.value.stage = stage
    }
    
    const [champion, runLog] = simulator.simulateOnce(config.value, onProgress)
    singleRun.value = runLog
  } catch (error) {
    console.error('Single simulation error:', error)
  } finally {
    isRunning.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.simulator-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 1.1em;
}

.config-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.config-panel h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-weight: 600;
  color: #374151;
}

.config-item input,
.config-item select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.config-item input:disabled,
.config-item select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.custom-seeds {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
}

.custom-seeds-header {
  background: #f8fafc;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.seed-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: grab;
  transition: background-color 0.2s ease;
}

.seed-item:hover {
  background-color: #f9fafb;
}

.seed-item:last-child {
  border-bottom: none;
}

.seed-item:active {
  cursor: grabbing;
}

.seed-number {
  background: #3b82f6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.seed-item .team-name {
  font-weight: 500;
  color: #1f2937;
}

.config-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.run-btn,
.single-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.run-btn {
  background: #3b82f6;
  color: white;
}

.run-btn:hover:not(:disabled) {
  background: #2563eb;
}

.single-btn {
  background: #10b981;
  color: white;
}

.single-btn:hover:not(:disabled) {
  background: #059669;
}

.run-btn:disabled,
.single-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.simulation-progress {
  background: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.progress-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3em;
}

.progress-info {
  max-width: 500px;
  margin: 0 auto;
}

.progress-text {
  font-size: 1.2em;
  margin-bottom: 20px;
  color: #374151;
}

.progress-text .current {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1.5em;
}

.progress-text .separator {
  margin: 0 8px;
  color: #6b7280;
}

.progress-text .total {
  font-weight: 600;
  color: #374151;
}

.progress-text .label {
  margin-left: 8px;
  color: #6b7280;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-weight: 600;
  color: #3b82f6;
  min-width: 40px;
  text-align: right;
}

.current-stage {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.stage-label {
  font-weight: 600;
  color: #374151;
}

.stage-name {
  color: #3b82f6;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results,
.single-results {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.result-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.result-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 10px;
}

.odds-table {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.scrollable-table {
  max-height: 400px;
  overflow-y: auto;
}

.scrollable-table::-webkit-scrollbar {
  width: 8px;
}

.scrollable-table::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scrollable-table::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.scrollable-table::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child {
  border-bottom: none;
}

.rank {
  font-weight: 600;
  color: #6b7280;
}

.rank-team {
  font-weight: 500;
  color: #1f2937;
}

.team-name {
  font-weight: 500;
  color: #1f2937;
}

.probability {
  font-weight: 600;
  color: #059669;
  text-align: right;
}

.swiss-buckets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.bucket-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #374151;
  font-size: 1.1em;
}

.elim-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.elim-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #374151;
  font-size: 1.1em;
}

.playoff-stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stage-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #374151;
  font-size: 1.1em;
}

.champion {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 30px;
}

.champion h3 {
  margin: 0;
  font-size: 1.5em;
}

.swiss-results {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.round-section {
  margin-bottom: 20px;
}

.round-section h4 {
  color: #374151;
  margin-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 5px;
}

.buckets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.bucket {
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.playoff-bracket {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.bracket {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.upper-bracket,
.lower-bracket {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.upper-bracket {
  border-color: #3b82f6;
}

.lower-bracket {
  border-color: #10b981;
}

.upper-bracket h4,
.lower-bracket h4 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.2em;
}

.upper-bracket h4 {
  color: #3b82f6;
}

.lower-bracket h4 {
  color: #10b981;
}

.bracket-rounds {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.round h5 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 1em;
}

.match {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
}

.team {
  font-weight: 500;
  color: #1f2937;
}

.score {
  font-weight: 600;
  color: #059669;
  text-align: center;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.winner {
  grid-column: 1 / -1;
  text-align: center;
  font-weight: 600;
  color: #059669;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.grand-final {
  border: 3px solid #fbbf24;
  border-radius: 8px;
  padding: 20px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.grand-final h4 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  color: #92400e;
  font-size: 1.3em;
}

.grand-final .match {
  background: white;
  border: 2px solid #fbbf24;
}

.grand-final .winner {
  color: #92400e;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .bracket {
    grid-template-columns: 1fr;
  }
  
  .swiss-buckets,
  .elim-section,
  .playoff-stages {
    grid-template-columns: 1fr;
  }
  
  .buckets {
    grid-template-columns: 1fr;
  }
}
</style>
