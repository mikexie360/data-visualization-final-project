import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface TeamInfo {
  team_id: number
  name: string
  rating: number
  wins: number
  losses: number
  logo_url: string
  invitation_type: string
}

export const useTeamStatsStore = defineStore('teamStats', () => {
  // Data state
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

  async function loadTeamData() {
    try {
      loading.value = true
      error.value = null
      
      const response = await fetch('/team_info.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      allTeams.value = data.teams
      
      // Initialize filter ranges with actual data bounds (only if not already set)
      if (data.teams.length > 0 && filters.value.ratingRange[0] === 1100) {
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

  return {
    // State
    allTeams,
    loading,
    error,
    searchQuery,
    sortBy,
    sortOrder,
    filtersCollapsed,
    filters,
    
    // Computed
    ratingBounds,
    winsBounds,
    lossesBounds,
    filteredTeams,
    
    // Functions
    calculateWinRate,
    formatInvitationType,
    resetFilters,
    toggleSortOrder,
    toggleFilters,
    loadTeamData
  }
})
