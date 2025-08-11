<template>
  <div class="team-stats-page">
    <h1>Team Statistics</h1>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading team data...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>Error loading team data: {{ error }}</p>
    </div>
    
    <div v-else class="teams-grid">
      <div 
        v-for="team in teams" 
        :key="team.team_id" 
        class="team-card"
      >
        <div class="team-header">
          <img 
            v-if="team.logo_url" 
            :src="team.logo_url" 
            :alt="`${team.name} logo`"
            class="team-logo"
            @error="handleLogoError"
          />
          <div class="team-name-container">
            <TeamName :team-name="team.name" />
          </div>
        </div>
        
        <div class="team-image">
          <img 
            :src="`/images/${getTeamDetailedImageFilename(team.name)}`"
            :alt="`${team.name} detailed chart`"
            @error="handleImageError"
          />
        </div>
        
        <div class="team-stats">
          <div class="stat-row">
            <span class="stat-label">Rating:</span>
            <span class="stat-value">{{ team.rating.toFixed(2) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Wins:</span>
            <span class="stat-value wins">{{ team.wins }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Losses:</span>
            <span class="stat-value losses">{{ team.losses }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Win Rate:</span>
            <span class="stat-value">{{ calculateWinRate(team.wins, team.losses) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TeamName from '@/components/TeamName.vue'
import { getTeamDetailedImageFilename } from '@/utils/teamUtils'

interface TeamInfo {
  team_id: number
  name: string
  rating: number
  wins: number
  losses: number
  logo_url: string
}

const teams = ref<TeamInfo[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

function calculateWinRate(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '0.00'
  return ((wins / total) * 100).toFixed(2)
}

function handleLogoError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/images/default_detailed.png'
}

async function loadTeamData() {
  try {
    const response = await fetch('/team_info.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    teams.value = data.teams
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTeamData()
})
</script>

<style scoped>
.team-stats-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.team-stats-page h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 2.5rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  color: #e74c3c;
  font-size: 1.2rem;
  margin-top: 50px;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.team-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 25px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e1e5e9;
  min-height: 500px;
}

.team-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.team-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 15px;
}

.team-logo {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e1e5e9;
  background-color: #000000;
}

.team-name-container {
  flex: 1;
}

.team-name-container :deep(.team-name) {
  font-size: 1.4rem;
  font-weight: bold;
  color: #2c3e50;
}

.team-image {
  margin-bottom: 20px;
  text-align: center;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  max-height: 300px;
  object-fit: contain;
}

.team-stats {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 600;
  color: #495057;
}

.stat-value {
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.wins {
  color: #28a745;
}

.stat-value.losses {
  color: #dc3545;
}

@media (max-width: 768px) {
  .teams-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .team-card {
    padding: 15px;
    min-height: 450px;
  }
  
  .team-image {
    min-height: 280px;
  }
  
  .team-stats-page h1 {
    font-size: 2rem;
  }
}
</style>
