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
            v-model.number="store.config.num_simulations" 
            type="number" 
            min="1" 
            max="10000"
            :disabled="store.isRunning"
          />
        </div>

        <div class="config-item">
          <label for="seeding-type">Round 1 Seeding:</label>
          <select 
            id="seeding-type"
            v-model="store.seedingType" 
            :disabled="store.isRunning"
          >
            <option value="random_1v16">Random (1v16)</option>
            <option value="random_adjacent">Random (Adjacent)</option>
            <option value="seeded_1v16">Seeded (1v16)</option>
            <option value="seeded_adjacent">Seeded (Adjacent)</option>
            <option value="custom">Custom Seeds</option>
          </select>
        </div>

        <div v-if="store.seedingType === 'custom'" class="config-item">
          <label for="custom-pairing">Custom Seeds Pairing Style:</label>
          <select 
            id="custom-pairing"
            v-model="store.customPairingStyle" 
            :disabled="store.isRunning"
          >
            <option value="1v16">1v16 (Strongest vs Weakest)</option>
            <option value="adjacent">Adjacent (Similar Strength)</option>
          </select>
        </div>

        <div v-if="store.seedingType === 'custom'" class="config-item">
          <label>Custom Team Seeds (Drag to reorder):</label>
          <div class="custom-seeds">
            <div class="custom-seeds-header">
              {{ store.customPairingStyle === '1v16' ? '1v16 Pairing: Strongest vs Weakest teams' : 'Adjacent Pairing: Similar strength teams' }}
              <button 
                @click="store.resetCustomSeedOrder()" 
                class="reset-seeds-btn"
                :disabled="store.isRunning"
              >
                Reset Order
              </button>
            </div>
            <div 
              v-for="(team, index) in store.customSeedOrder" 
              :key="team.team_id"
              class="seed-item"
              draggable="true"
              @dragstart="dragStart($event, index)"
              @dragover.prevent
              @drop="drop($event, index)"
            >
              <span class="seed-number">{{ index + 1 }}</span>
              <TeamName :team-name="team.name" />
            </div>
          </div>
        </div>

        <div class="config-item">
          <label for="rng-seed">RNG Seed:</label>
          <input 
            id="rng-seed"
            v-model.number="store.rngSeed" 
            type="number" 
            :disabled="store.isRunning"
          />
        </div>
      </div>

      <div class="config-actions">
        <button 
          @click="() => { console.log('Run Simulation button clicked'); runSimulation(); }" 
          :disabled="store.isRunning || !store.isDataLoaded"
          class="run-btn"
        >
          {{ store.isRunning ? 'Running...' : 'Run Simulation' }}
        </button>
        <button 
          @click="() => { console.log('Run Single Tournament button clicked'); runSingleSimulation(); }" 
          :disabled="store.isRunning || !store.isDataLoaded"
          class="single-btn"
        >
          Run Single Tournament
        </button>
      </div>
    </div>

         <!-- Loading State -->
     <div v-if="!store.isDataLoaded" class="loading">
       <div class="spinner"></div>
       <p>Loading tournament data...</p>
     </div>

     <!-- Simulation Progress -->
     <div v-if="store.isRunning" class="simulation-progress">
       <div class="progress-header">
         <div class="spinner"></div>
         <h3>{{ store.progress.isMonteCarlo ? 'Running Monte Carlo Simulation' : 'Running Single Tournament' }}</h3>
       </div>
       
       <div class="progress-info">
         <div class="progress-text">
           <span class="current">{{ store.progress.current }}</span>
           <span class="separator">/</span>
           <span class="total">{{ store.progress.total }}</span>
           <span class="label">tournaments</span>
         </div>
         
         <div class="progress-bar-container">
           <div class="progress-bar">
             <div 
               class="progress-fill" 
               :style="{ width: store.progress.total > 0 ? `${(store.progress.current / store.progress.total) * 100}%` : '0%' }"
             ></div>
           </div>
           <span class="progress-percentage">
             {{ store.progress.total > 0 ? Math.round((store.progress.current / store.progress.total) * 100) : 0 }}%
           </span>
         </div>
         
         <div class="current-stage">
           <span class="stage-label">Current Stage:</span>
           <span class="stage-name">{{ store.progress.stage }}</span>
         </div>
       </div>
     </div>

    <!-- Results -->
    <div v-if="store.results && !store.isRunning" class="results">
             <!-- Title Odds -->
       <div class="result-section">
         <h2>🏆 Championship Win Probabilities</h2>
         <div class="odds-table scrollable-table">
           <div class="table-header">
             <span>Rank & Team</span>
             <span>Win Probability</span>
           </div>
           <div 
             v-for="(team, index) in store.getAllTeamsForChampionship()" 
             :key="team.team_id"
             class="table-row"
           >
             <span class="rank-team">{{ index + 1 }}. <TeamName :team-name="team.team" /></span>
             <span class="probability">{{ (team.win_prob * 100).toFixed(2) }}%</span>
           </div>
         </div>
       </div>

      <!-- Swiss Stage Probabilities -->
      <div class="result-section">
        <h2>🧀 Swiss Stage Reach Probabilities</h2>
        <div class="swiss-buckets">
          <div 
            v-for="(bucket, bucketKey) in store.results.swiss_final_probs" 
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
                v-for="team in store.getAllTeamsForBucket(bucketKey)" 
                :key="team.team_id"
                class="table-row"
              >
                <TeamName :team-name="team.team" />
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
              v-for="team in store.getAllTeamsForElimination('participation')" 
              :key="team.team_id"
              class="table-row"
            >
              <TeamName :team-name="team.team" />
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
              v-for="team in store.getAllTeamsForElimination('advancement')" 
              :key="team.team_id"
              class="table-row"
            >
              <TeamName :team-name="team.team" />
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
            v-for="(stage, stageKey) in store.playoffStages" 
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
                v-for="team in store.getAllTeamsForStage(stageKey)" 
                :key="team.team_id"
                class="table-row"
              >
                <TeamName :team-name="team.team" />
                <span class="probability">{{ (team.prob * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Tournament Results -->
    <div v-if="store.singleRun && !store.isRunning" class="single-results">
      <h2>🎯 Single Tournament Run</h2>
      <div class="champion">
        <h3>🏆 Champion: <TeamName :team-name="store.singleRun.champion.name" /></h3>
      </div>
      
      <!-- Swiss Results -->
      <div class="swiss-results">
        <h3>Swiss Stage Results</h3>
        


        <!-- Round-by-Round Results -->
        <div class="rounds-container">
          <div class="rounds-grid">
            <div 
              v-for="round in store.singleRun.swiss.rounds" 
              :key="round.round"
              class="round-section"
            >
              <h4>Round {{ round.round }}</h4>
              
              <!-- Buckets and Pairings -->
              <div class="buckets-container">
                <div 
                  v-for="(bucketTeams, bucketKey) in round.buckets_names" 
                  :key="bucketKey"
                  class="bucket-section"
                >
                  <h5 class="bucket-title">{{ bucketKey }} ({{ bucketTeams.length }} teams)</h5>
                  
                  <!-- Pairings in this bucket -->
                  <div class="pairings">
                    <div 
                      v-for="(pairing, index) in round.pairings.filter(p => {
                        const teamA = store.singleRun?.teams.find(t => t.id === p.A)?.name || ''
                        const teamB = store.singleRun?.teams.find(t => t.id === p.B)?.name || ''
                        return bucketTeams.includes(teamA) || bucketTeams.includes(teamB)
                      })" 
                      :key="index"
                      class="pairing"
                    >
                      <div class="match-result">
                        <div class="team team-a">
                    <TeamName :team-name="store.singleRun.teams.find(t => t.id === pairing.A)?.name || ''" />
                  </div>
                        <div class="score">
                          {{ round.matches.find(m => 
                            (m.A.id === pairing.A && m.B.id === pairing.B) || 
                            (m.A.id === pairing.B && m.B.id === pairing.A)
                          )?.final_score?.[0] || '0' }} - 
                          {{ round.matches.find(m => 
                            (m.A.id === pairing.A && m.B.id === pairing.B) || 
                            (m.A.id === pairing.B && m.B.id === pairing.A)
                          )?.final_score?.[1] || '0' }}
                        </div>
                        <div class="team team-b">
                    <TeamName :team-name="store.singleRun.teams.find(t => t.id === pairing.B)?.name || ''" />
                  </div>
                        <div class="winner">
                          Winner: <TeamName :team-name="round.matches.find(m => 
                            (m.A.id === pairing.A && m.B.id === pairing.B) || 
                            (m.A.id === pairing.B && m.B.id === pairing.A)
                          )?.winner?.name || 'TBD'" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
                         <!-- Final Standings -->
                         <div class="final-standings">
           <h4>Final Standings After Round 5</h4>
           

           <!-- Rankings by Record Groups -->
           <div class="record-group-rankings">
             <h5>Rankings by Final Record</h5>
             
             <!-- Group teams by their final records -->
             <div 
               v-for="recordGroup in getRecordGroups()" 
               :key="recordGroup.record"
               class="record-group"
             >
               <h6 class="record-group-title">{{ recordGroup.record }} ({{ recordGroup.teams.length }} teams)</h6>
               <div class="standings-table">
                 <div class="table-header">
                   <span>Rank</span>
                   <span>Team</span>
                   <span>Buchholz</span>
                 </div>
                 <div 
                   v-for="(team, index) in recordGroup.teams" 
                   :key="team.id"
                   class="table-row"
                 >
                   <span class="rank">{{ team.overallRank }}</span>
                   <TeamName :team-name="team.name" />
                   <span class="buchholz">{{ team.buchholz.toFixed(2) }}</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
      </div>

      <!-- Swiss Stage Advancement -->
      <div class="swiss-advancement">
        <h3>🎯 Swiss Stage Advancement</h3>
        <div class="advancement-info">
          <p><strong>Format:</strong> After 5 rounds of Swiss, teams are divided into three groups based on their final ranking</p>
        </div>
        
        <div class="advancement-groups">
          <!-- Top 3 - Auto Advance to Playoffs -->
          <div class="advancement-group auto-advance">
            <h4>🥇 Auto Advance to Playoffs (Top 3)</h4>
            <div class="team-list">
              <div 
                v-for="(teamId, index) in store.singleRun.swiss.rank.order.slice(0, 3)" 
                :key="teamId"
                class="team-item"
              >
                <span class="rank">#{{ index + 1 }}</span>
                <TeamName :team-name="store.singleRun.teams.find(t => t.id === teamId)?.name || ''" />
                <span class="record">{{ store.singleRun.swiss.records_final[teamId][0] }}-{{ store.singleRun.swiss.records_final[teamId][1] }}</span>
                <span class="buchholz">{{ store.singleRun.swiss.rank.buchholz[teamId]?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </div>

          <!-- Teams 4-13 - Elimination Round -->
          <div class="advancement-group elimination-round">
            <h4>⚔️ Elimination Round (Teams 4-13)</h4>
            <div class="team-list">
              <div 
                v-for="(teamId, index) in store.singleRun.swiss.rank.order.slice(3, 13)" 
                :key="teamId"
                class="team-item"
              >
                <span class="rank">#{{ index + 4 }}</span>
                <TeamName :team-name="store.singleRun.teams.find(t => t.id === teamId)?.name || ''" />
                <span class="record">{{ store.singleRun.swiss.records_final[teamId][0] }}-{{ store.singleRun.swiss.records_final[teamId][1] }}</span>
                <span class="buchholz">{{ store.singleRun.swiss.rank.buchholz[teamId]?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </div>

          <!-- Teams 14-16 - Eliminated -->
          <div class="advancement-group eliminated">
            <h4>❌ Eliminated (Teams 14-16)</h4>
            <div class="team-list">
              <div 
                v-for="(teamId, index) in store.singleRun.swiss.rank.order.slice(13, 16)" 
                :key="teamId"
                class="team-item"
              >
                <span class="rank">#{{ index + 14 }}</span>
                <TeamName :team-name="store.singleRun.teams.find(t => t.id === teamId)?.name || ''" />
                <span class="record">{{ store.singleRun.swiss.records_final[teamId][0] }}-{{ store.singleRun.swiss.records_final[teamId][1] }}</span>
                <span class="buchholz">{{ store.singleRun.swiss.rank.buchholz[teamId]?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Elimination Round Results -->
      <div class="elimination-results">
        <h3>⚔️ Elimination Round Results</h3>
        <div class="elimination-matches">
          <div class="elimination-info">
            <p><strong>Format:</strong> Top 10 teams from Swiss stage compete in single elimination to reduce to 5 teams for playoffs</p>
          </div>
          
          <div class="matches-container">
            <div 
              v-for="(match, index) in store.singleRun.elimination_round.matches" 
              :key="index"
              class="elimination-match"
            >
              <div class="match-header">
                <h4>Match {{ index + 1 }}</h4>
              </div>
              <div class="match-content">
                <div class="team"><TeamName :team-name="match.A.name" /></div>
                <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                <div class="team"><TeamName :team-name="match.B.name" /></div>
                <div class="winner">Winner: <TeamName :team-name="match.winner.name" /></div>
              </div>
            </div>
          </div>

          <div class="elimination-summary">
            <h4>Teams Advancing to Playoffs</h4>
            <div class="advancing-teams">
              <div 
                v-for="winnerId in store.singleRun.elimination_round.winners" 
                :key="winnerId"
                class="advancing-team"
              >
                <TeamName :team-name="store.singleRun.teams.find(t => t.id === winnerId)?.name || ''" />
              </div>
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
                  v-for="match in store.singleRun.playoffs.UB.QF" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team"><TeamName :team-name="match.A.name" /></div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="match.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="match.winner.name" /></div>
                </div>
              </div>
              <div class="round">
                <h5>Semifinals</h5>
                <div 
                  v-for="match in store.singleRun.playoffs.UB.SF" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team"><TeamName :team-name="match.A.name" /></div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="match.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="match.winner.name" /></div>
                </div>
              </div>
              <div class="round">
                <h5>Final</h5>
                <div class="match">
                  <div class="team"><TeamName :team-name="store.singleRun.playoffs.UB.Final.A.name" /></div>
                  <div class="score">{{ store.singleRun.playoffs.UB.Final.final_score[0] }}-{{ store.singleRun.playoffs.UB.Final.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="store.singleRun.playoffs.UB.Final.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="store.singleRun.playoffs.UB.Final.winner.name" /></div>
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
                  v-for="match in store.singleRun.playoffs.LB.R1" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team"><TeamName :team-name="match.A.name" /></div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="match.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="match.winner.name" /></div>
                </div>
              </div>
              <div class="round">
                <h5>Round 2</h5>
                <div 
                  v-for="match in store.singleRun.playoffs.LB.R2" 
                  :key="match.label"
                  class="match"
                >
                  <div class="team"><TeamName :team-name="match.A.name" /></div>
                  <div class="score">{{ match.final_score[0] }}-{{ match.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="match.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="match.winner.name" /></div>
                </div>
              </div>
              <div class="round">
                <h5>Quarterfinal</h5>
                <div class="match">
                  <div class="team"><TeamName :team-name="store.singleRun.playoffs.LB.QF.A.name" /></div>
                  <div class="score">{{ store.singleRun.playoffs.LB.QF.final_score[0] }}-{{ store.singleRun.playoffs.LB.QF.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="store.singleRun.playoffs.LB.QF.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="store.singleRun.playoffs.LB.QF.winner.name" /></div>
                </div>
              </div>
              <div class="round">
                <h5>Final</h5>
                <div class="match">
                  <div class="team"><TeamName :team-name="store.singleRun.playoffs.LB.Final.A.name" /></div>
                  <div class="score">{{ store.singleRun.playoffs.LB.Final.final_score[0] }}-{{ store.singleRun.playoffs.LB.Final.final_score[1] }}</div>
                  <div class="team"><TeamName :team-name="store.singleRun.playoffs.LB.Final.B.name" /></div>
                  <div class="winner">Winner: <TeamName :team-name="store.singleRun.playoffs.LB.Final.winner.name" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grand-final">
          <h4>Grand Final</h4>
          <div class="match">
            <div class="team"><TeamName :team-name="store.singleRun.playoffs.GF.A.name" /></div>
            <div class="score">{{ store.singleRun.playoffs.GF.final_score[0] }}-{{ store.singleRun.playoffs.GF.final_score[1] }}</div>
            <div class="team"><TeamName :team-name="store.singleRun.playoffs.GF.B.name" /></div>
            <div class="winner">🏆 Champion: <TeamName :team-name="store.singleRun.playoffs.GF.winner.name" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSimStore } from '@/stores/sim'
import { loadTeams, loadProbMatrix } from '@/services/loadData'
import { TournamentSimulator } from '@/services/tournamentSimulator'
import type { Team, ProbMatrix } from '@/types'
import TeamName from '@/components/TeamName.vue'

const store = useSimStore()

// Drag and drop functionality
const draggedIndex = ref<number | null>(null)

function dragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function drop(event: DragEvent, index: number) {
  event.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) return

  const teams = [...store.customSeedOrder]
  const draggedTeam = teams[draggedIndex.value]
  teams.splice(draggedIndex.value, 1)
  teams.splice(index, 0, draggedTeam)
  store.customSeedOrder = teams
  draggedIndex.value = null
}

async function loadData() {
  if (store.isDataLoaded) return

  try {
    const [teamsData, probMatrixData] = await Promise.all([
      loadTeams(),
      loadProbMatrix()
    ])
    store.setData(teamsData, probMatrixData)
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

async function runSimulation() {
  if (!store.isDataLoaded) return
  
  console.log('Starting simulation, setting isRunning to true')
  store.isRunning = true
  store.results = null
  store.singleRun = null
  
  // Initialize progress tracking
  store.progress = {
    current: 0,
    total: store.config.num_simulations,
    stage: 'Initializing...',
    isMonteCarlo: true
  }
  
  console.log('Progress initialized:', store.progress)
  console.log('isRunning value:', store.isRunning)
  
  // Ensure UI updates before starting simulation
  await nextTick()
  
  // Add a small delay to make the loading state visible
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    store.updateConfig()
    const simulator = new TournamentSimulator(store.teams, store.probMatrix, store.rngSeed)
    
    // Create a progress callback
    const onProgress = async (current: number, stage: string) => {
      console.log('Progress callback:', current, stage)
      store.progress.current = current
      store.progress.stage = stage
      // Ensure UI updates on each progress callback
      await nextTick()
    }
    
    const [titleOdds, logs, stats] = await simulator.monteCarlo(store.config, onProgress)
    store.results = stats
  } catch (error) {
    console.error('Simulation error:', error)
  } finally {
    console.log('Simulation complete, setting isRunning to false')
    store.isRunning = false
  }
}

async function runSingleSimulation() {
  if (!store.isDataLoaded) return
  
  store.isRunning = true
  store.results = null
  store.singleRun = null
  
  // Initialize progress tracking
  store.progress = {
    current: 0,
    total: 1,
    stage: 'Initializing...',
    isMonteCarlo: false
  }
  
  // Ensure UI updates before starting simulation
  await nextTick()
  
  // Add a small delay to make the loading state visible
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    store.updateConfig()
    const simulator = new TournamentSimulator(store.teams, store.probMatrix, store.rngSeed)
    
    // Create a progress callback
    const onProgress = async (current: number, stage: string) => {
      store.progress.current = current
      store.progress.stage = stage
      // Ensure UI updates on each progress callback
      await nextTick()
    }
    
    const [champion, runLog] = await simulator.simulateOnce(store.config, onProgress)
    store.singleRun = runLog
  } catch (error) {
    console.error('Single simulation error:', error)
  } finally {
    store.isRunning = false
  }
}

// Helper function to group teams by their final records
function getRecordGroups() {
  if (!store.singleRun) return []
  
  const recordGroups: { [key: string]: Array<{
    id: number
    name: string
    overallRank: number
    buchholz: number
  }> } = {}
  
  // Group teams by their final record
  store.singleRun.swiss.rank.order.forEach((teamId, index) => {
    const team = store.singleRun!.teams.find(t => t.id === teamId)
    const record = store.singleRun!.swiss.records_final[teamId]
    const buchholz = store.singleRun!.swiss.rank.buchholz[teamId] || 0
    
    if (team && record) {
      const recordKey = `${record[0]}-${record[1]}`
      if (!recordGroups[recordKey]) {
        recordGroups[recordKey] = []
      }
      
      recordGroups[recordKey].push({
        id: teamId,
        name: team.name,
        overallRank: index + 1,
        buchholz: buchholz
      })
    }
  })
  
  // Convert to array and sort by record (4-0, 4-1, 3-2, 3-3, 2-4, 1-4, 0-4)
  return Object.entries(recordGroups)
    .map(([record, teams]) => ({
      record,
      teams: teams.sort((a, b) => b.buchholz - a.buchholz) // Sort by Buchholz within each record group
    }))
    .sort((a, b) => {
      // Sort record groups by wins first, then by losses
      const [aWins, aLosses] = a.record.split('-').map(Number)
      const [bWins, bLosses] = b.record.split('-').map(Number)
      
      if (aWins !== bWins) return bWins - aWins // Higher wins first
      return aLosses - bLosses // Lower losses first
    })
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reset-seeds-btn {
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.reset-seeds-btn:hover:not(:disabled) {
  background: #4b5563;
}

.reset-seeds-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
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

.final-standings {
  margin-bottom: 30px;
}

.final-standings h4 {
  color: #374151;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
  font-size: 1.3em;
}

.overall-rankings {
  margin-bottom: 30px;
}

.overall-rankings h5 {
  color: #374151;
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
}

.record-group-rankings h5 {
  color: #374151;
  margin-bottom: 20px;
  font-size: 1.1em;
  font-weight: 600;
}

.record-group {
  margin-bottom: 25px;
}

.record-group-title {
  color: #374151;
  margin-bottom: 12px;
  font-size: 1em;
  font-weight: 600;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 4px solid #3b82f6;
}

.standings-table {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.standings-table .table-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px 120px;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.standings-table .table-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 120px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.standings-table .table-row:hover {
  background: #f9fafb;
}

.standings-table .table-row:last-child {
  border-bottom: none;
}

.standings-table .rank {
  font-weight: 600;
  color: #6b7280;
}

.standings-table .team-name {
  font-weight: 500;
  color: #1f2937;
}

.standings-table .record {
  font-weight: 600;
  color: #059669;
  text-align: center;
}

.standings-table .buchholz {
  font-weight: 600;
  color: #7c3aed;
  text-align: center;
}

.rounds-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
  overflow-x: auto;
}

.rounds-grid {
  display: flex;
  flex-direction: row;
  gap: 20px;
  min-width: max-content;
}

.round-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.round-section h4 {
  color: #374151;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
  font-size: 1.2em;
}

.buckets-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.bucket-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 15px;
}

.bucket-title {
  color: #374151;
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
}

.pairings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pairing {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.match-result {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 15px;
  align-items: center;
}

.match-result .team {
  font-weight: 500;
  color: #1f2937;
  text-align: center;
}

.match-result .score {
  font-weight: 600;
  color: #059669;
  text-align: center;
  background: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  min-width: 60px;
}

.match-result .winner {
  grid-column: 1 / -1;
  text-align: center;
  font-weight: 600;
  color: #059669;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.records-after {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 15px;
}

.records-after h5 {
  color: #374151;
  margin-bottom: 15px;
  font-size: 1em;
  font-weight: 600;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 14px;
}

.record-item .team-name {
  font-weight: 500;
  color: #1f2937;
}

.record-item .record {
  font-weight: 600;
  color: #059669;
}

.elimination-results {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.elimination-results h3 {
  color: #374151;
  margin-bottom: 20px;
  border-bottom: 2px solid #dc2626;
  padding-bottom: 10px;
  font-size: 1.3em;
}

.elimination-info {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.elimination-info p {
  margin: 0;
  color: #991b1b;
  font-size: 0.95em;
}

.matches-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.elimination-match {
  background: #f9fafb;
  border: 2px solid #dc2626;
  border-radius: 8px;
  padding: 15px;
  transition: transform 0.2s ease;
}

.elimination-match:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.match-header h4 {
  margin: 0 0 12px 0;
  color: #dc2626;
  font-size: 1.1em;
  font-weight: 600;
  text-align: center;
}

.match-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.match-content .team {
  font-weight: 500;
  color: #1f2937;
  text-align: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.match-content .score {
  font-weight: 600;
  color: #dc2626;
  text-align: center;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 2px solid #dc2626;
  min-width: 70px;
  font-size: 1.1em;
}

.match-content .winner {
  grid-column: 1 / -1;
  text-align: center;
  font-weight: 600;
  color: #dc2626;
  margin-top: 10px;
  padding: 8px;
  background: #fef2f2;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.elimination-summary {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 20px;
}

.elimination-summary h4 {
  color: #0369a1;
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
}

.advancing-teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.advancing-team {
  background: white;
  border: 2px solid #0ea5e9;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #0369a1;
  transition: all 0.2s ease;
}

.advancing-team:hover {
  background: #0ea5e9;
  color: white;
  transform: scale(1.02);
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

/* Swiss Stage Advancement Styles */
.swiss-advancement {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.swiss-advancement h3 {
  color: #374151;
  margin-bottom: 20px;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 10px;
  font-size: 1.3em;
}

.advancement-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.advancement-info p {
  margin: 0;
  color: #1e40af;
  font-size: 0.95em;
}

.advancement-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.advancement-group {
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.2s ease;
}

.advancement-group:hover {
  transform: translateY(-2px);
}

.advancement-group h4 {
  margin: 0 0 15px 0;
  font-size: 1.1em;
  font-weight: 600;
  text-align: center;
}

.auto-advance {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #22c55e;
}

.auto-advance h4 {
  color: #15803d;
}

.elimination-round {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  border: 2px solid #dc2626;
}

.elimination-round h4 {
  color: #991b1b;
}

.eliminated {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border: 2px solid #6b7280;
}

.eliminated h4 {
  color: #374151;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 12px;
  align-items: center;
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.team-item:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.team-item .rank {
  font-weight: 600;
  color: #6b7280;
  min-width: 30px;
}

.team-item .team-name {
  font-weight: 500;
  color: #1f2937;
}

.team-item .record {
  font-weight: 600;
  color: #059669;
  background: #f0fdf4;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
  text-align: center;
  min-width: 50px;
}

.team-item .buchholz {
  font-weight: 600;
  color: #7c3aed;
  background: #faf5ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd6fe;
  text-align: center;
  min-width: 60px;
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
  
  .advancement-groups {
    grid-template-columns: 1fr;
  }
  
  .rounds-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .rounds-grid {
    min-width: max-content;
    gap: 15px;
  }
  
  .round-section {
    min-width: 300px;
    padding: 15px;
  }
}
</style>
