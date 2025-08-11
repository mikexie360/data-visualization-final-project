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
    
    <div v-else>
             <!-- Filters and Search Section -->
       <div class="filters-section" :class="{ collapsed: filtersCollapsed }">
         <div class="filters-header">
           <div class="filters-title">
             <h3>Filters & Search</h3>
             <span class="results-count">({{ filteredTeams.length }}/{{ allTeams.length }})</span>
           </div>
           <div class="filters-actions">
             <button @click="resetFilters" class="reset-btn">
               <i class="pi pi-refresh"></i>
               <span class="btn-text">Reset</span>
             </button>
             <button @click="toggleFilters" class="toggle-btn">
               <i :class="filtersCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"></i>
             </button>
           </div>
                  </div>
         
         <!-- Collapsible Filter Content -->
         <div class="filters-content" :class="{ hidden: filtersCollapsed }">
           <div class="filters-grid">
             <!-- Search Bar -->
             <div class="filter-group">
               <label>Search Teams:</label>
               <input 
                 v-model="searchQuery" 
                 type="text" 
                 placeholder="Search by team name..."
                 class="search-input"
               />
             </div>
             
             <!-- Invitation Type Filter -->
             <div class="filter-group">
               <label>Invitation Type:</label>
               <div class="checkbox-group">
                 <label class="checkbox-label">
                   <input 
                     type="checkbox" 
                     v-model="filters.invitationTypes" 
                     value="direct_invite"
                   />
                   Direct Invite
                 </label>
                 <label class="checkbox-label">
                   <input 
                     type="checkbox" 
                     v-model="filters.invitationTypes" 
                     value="regional_qualifier"
                   />
                   Regional Qualifier
                 </label>
               </div>
             </div>
             
             <!-- Rating Range Filter -->
             <div class="filter-group">
               <label>Rating: {{ filters.ratingRange[0] }} - {{ filters.ratingRange[1] }}</label>
               <div class="range-slider">
                 <input 
                   type="range" 
                   v-model="filters.ratingRange[0]" 
                   :min="ratingBounds.min" 
                   :max="ratingBounds.max" 
                   step="0.01"
                   class="range-input"
                 />
                 <input 
                   type="range" 
                   v-model="filters.ratingRange[1]" 
                   :min="ratingBounds.min" 
                   :max="ratingBounds.max" 
                   step="0.01"
                   class="range-input"
                 />
               </div>
             </div>
             
             <!-- Wins Range Filter -->
             <div class="filter-group">
               <label>Wins: {{ filters.winsRange[0] }} - {{ filters.winsRange[1] }}</label>
               <div class="range-slider">
                 <input 
                   type="range" 
                   v-model="filters.winsRange[0]" 
                   :min="winsBounds.min" 
                   :max="winsBounds.max" 
                   step="1"
                   class="range-input"
                 />
                 <input 
                   type="range" 
                   v-model="filters.winsRange[1]" 
                   :min="winsBounds.min" 
                   :max="winsBounds.max" 
                   step="1"
                   class="range-input"
                 />
               </div>
             </div>
             
             <!-- Losses Range Filter -->
             <div class="filter-group">
               <label>Losses: {{ filters.lossesRange[0] }} - {{ filters.lossesRange[1] }}</label>
               <div class="range-slider">
                 <input 
                   type="range" 
                   v-model="filters.lossesRange[0]" 
                   :min="lossesBounds.min" 
                   :max="lossesBounds.max" 
                   step="1"
                   class="range-input"
                 />
                 <input 
                   type="range" 
                   v-model="filters.lossesRange[1]" 
                   :min="lossesBounds.min" 
                   :max="lossesBounds.max" 
                   step="1"
                   class="range-input"
                 />
               </div>
             </div>
             
             <!-- Win Rate Range Filter -->
             <div class="filter-group">
               <label>Win Rate: {{ filters.winRateRange[0] }}% - {{ filters.winRateRange[1] }}%</label>
               <div class="range-slider">
                 <input 
                   type="range" 
                   v-model="filters.winRateRange[0]" 
                   :min="0" 
                   :max="100" 
                   step="0.1"
                   class="range-input"
                 />
                 <input 
                   type="range" 
                   v-model="filters.winRateRange[1]" 
                   :min="0" 
                   :max="100" 
                   step="0.1"
                   class="range-input"
                 />
               </div>
             </div>
             
             <!-- Sort Options -->
             <div class="filter-group">
               <label>Sort By:</label>
               <div class="sort-controls">
                 <select v-model="sortBy" class="sort-select">
                   <option value="name">Team Name</option>
                   <option value="rating">Rating</option>
                   <option value="wins">Wins</option>
                   <option value="losses">Losses</option>
                   <option value="winRate">Win Rate</option>
                   <option value="invitationType">Invitation Type</option>
                 </select>
                 <button @click="toggleSortOrder" class="sort-btn">
                   <i :class="sortOrder === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'"></i>
                 </button>
               </div>
             </div>
           </div>
         </div>
      </div>
      
      <!-- Teams Grid -->
      <div class="teams-grid">
        <div 
          v-for="team in filteredTeams" 
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
              <div class="invitation-type">
                {{ formatInvitationType(team.invitation_type) }}
              </div>
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
            <div class="stat-row">
              <span class="stat-label">Type:</span>
              <span class="stat-value invitation-type">{{ formatInvitationType(team.invitation_type) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TeamName from '@/components/TeamName.vue'
import { getTeamDetailedImageFilename } from '@/utils/teamUtils'

interface TeamInfo {
  team_id: number
  name: string
  rating: number
  wins: number
  losses: number
  logo_url: string
  invitation_type: string
}

const allTeams = ref<TeamInfo[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Search and filter state
const searchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const filtersCollapsed = ref(false)

const filters = ref({
  invitationTypes: ['direct_invite', 'regional_qualifier'],
  ratingRange: [1100, 1600],
  winsRange: [0, 2000],
  lossesRange: [0, 2000],
  winRateRange: [0, 100]
})

// Computed bounds for range sliders
const ratingBounds = computed(() => {
  if (allTeams.value.length === 0) return { min: 0, max: 2000 }
  const ratings = allTeams.value.map(t => t.rating)
  return { min: Math.floor(Math.min(...ratings)), max: Math.ceil(Math.max(...ratings)) }
})

const winsBounds = computed(() => {
  if (allTeams.value.length === 0) return { min: 0, max: 2000 }
  const wins = allTeams.value.map(t => t.wins)
  return { min: Math.min(...wins), max: Math.max(...wins) }
})

const lossesBounds = computed(() => {
  if (allTeams.value.length === 0) return { min: 0, max: 2000 }
  const losses = allTeams.value.map(t => t.losses)
  return { min: Math.min(...losses), max: Math.max(...losses) }
})

// Fuzzy search function
function fuzzySearch(text: string, query: string): boolean {
  if (!query) return true
  const normalizedText = text.toLowerCase()
  const normalizedQuery = query.toLowerCase()
  
  let queryIndex = 0
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++
    }
  }
  return queryIndex === normalizedQuery.length
}

// Filter and sort teams
const filteredTeams = computed(() => {
  let filtered = allTeams.value.filter(team => {
    // Search filter
    if (!fuzzySearch(team.name, searchQuery.value)) return false
    
    // Invitation type filter
    if (!filters.value.invitationTypes.includes(team.invitation_type)) return false
    
    // Rating filter
    if (team.rating < filters.value.ratingRange[0] || team.rating > filters.value.ratingRange[1]) return false
    
    // Wins filter
    if (team.wins < filters.value.winsRange[0] || team.wins > filters.value.winsRange[1]) return false
    
    // Losses filter
    if (team.losses < filters.value.lossesRange[0] || team.losses > filters.value.lossesRange[1]) return false
    
    // Win rate filter
    const winRate = parseFloat(calculateWinRate(team.wins, team.losses))
    if (winRate < filters.value.winRateRange[0] || winRate > filters.value.winRateRange[1]) return false
    
    return true
  })
  
  // Sort teams
  filtered.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy.value) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'rating':
        aValue = a.rating
        bValue = b.rating
        break
      case 'wins':
        aValue = a.wins
        bValue = b.wins
        break
      case 'losses':
        aValue = a.losses
        bValue = b.losses
        break
      case 'winRate':
        aValue = parseFloat(calculateWinRate(a.wins, a.losses))
        bValue = parseFloat(calculateWinRate(b.wins, b.losses))
        break
      case 'invitationType':
        aValue = a.invitation_type
        bValue = b.invitation_type
        break
      default:
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
    }
    
    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  
  return filtered
})

function calculateWinRate(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '0.00'
  return ((wins / total) * 100).toFixed(2)
}

function formatInvitationType(type: string): string {
  return type === 'direct_invite' ? 'Direct Invite' : 'Regional Qualifier'
}

function resetFilters() {
  searchQuery.value = ''
  filters.value = {
    invitationTypes: ['direct_invite', 'regional_qualifier'],
    ratingRange: [ratingBounds.value.min, ratingBounds.value.max],
    winsRange: [winsBounds.value.min, winsBounds.value.max],
    lossesRange: [lossesBounds.value.min, lossesBounds.value.max],
    winRateRange: [0, 100]
  }
  sortBy.value = 'name'
  sortOrder.value = 'asc'
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

function toggleFilters() {
  filtersCollapsed.value = !filtersCollapsed.value
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
    allTeams.value = data.teams
    
    // Initialize filter ranges with actual data bounds
    if (data.teams.length > 0) {
      const ratings = data.teams.map((t: TeamInfo) => t.rating)
      const wins = data.teams.map((t: TeamInfo) => t.wins)
      const losses = data.teams.map((t: TeamInfo) => t.losses)
      
      filters.value.ratingRange = [Math.floor(Math.min(...ratings)), Math.ceil(Math.max(...ratings))]
      filters.value.winsRange = [Math.min(...wins), Math.max(...wins)]
      filters.value.lossesRange = [Math.min(...losses), Math.max(...losses)]
    }
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

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  transition: all 0.3s ease;
}

.filters-section.collapsed {
  padding-bottom: 15px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters-title h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.results-count {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.filters-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
}

.reset-btn:hover {
  background: #c82333;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-btn:hover {
  background: #e5e7eb;
}

.filters-content {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 1000px;
  opacity: 1;
}

.filters-content.hidden {
  max-height: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.filters-grid::-webkit-scrollbar {
  width: 6px;
}

.filters-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.filters-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.filters-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.filter-group {
  margin-bottom: 12px;
}

.filter-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #495057;
  font-size: 0.85rem;
}

.search-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.checkbox-group {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.range-slider {
  position: relative;
  height: 30px;
  display: flex;
  align-items: center;
}

.range-input {
  position: absolute;
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
  pointer-events: none;
  appearance: none;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-input:nth-child(1) {
  z-index: 1;
}

.range-input:nth-child(2) {
  z-index: 2;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
  flex: 1;
}

.sort-btn {
  padding: 6px 10px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.sort-btn:hover {
  background: #e5e7eb;
}

.btn-text {
  display: inline;
}

@media (max-width: 768px) {
  .filters-section {
    padding: 12px;
    margin-bottom: 15px;
  }
  
  .filters-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
  }
  
  .filters-title h3 {
    font-size: 1.1rem;
  }
  
  .results-count {
    font-size: 0.8rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    max-height: 350px;
  }
  
  .filter-group {
    margin-bottom: 10px;
  }
  
  .filter-group label {
    font-size: 0.8rem;
    margin-bottom: 5px;
  }
  
  .search-input {
    padding: 7px 9px;
    font-size: 0.85rem;
  }
  
  .checkbox-group {
    gap: 12px;
  }
  
  .checkbox-label {
    font-size: 0.8rem;
  }
  
  .range-slider {
    height: 28px;
  }
  
  .range-input {
    height: 3px;
  }
  
  .range-input::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
  }
  
  .range-input::-moz-range-thumb {
    width: 14px;
    height: 14px;
  }
  
  .sort-controls {
    gap: 6px;
  }
  
  .sort-select {
    padding: 5px 8px;
    font-size: 0.8rem;
  }
  
  .sort-btn {
    padding: 5px 8px;
  }
  
  .reset-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
  }
  
  .toggle-btn {
    width: 28px;
    height: 28px;
  }
  
  .btn-text {
    display: none;
  }
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

.invitation-type {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
  font-weight: 500;
}

.stat-value.invitation-type {
  font-size: 0.85rem;
  color: #6b7280;
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
