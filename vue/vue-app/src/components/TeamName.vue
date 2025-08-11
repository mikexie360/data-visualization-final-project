<template>
  <span 
    class="team-name" 
    @mouseover="showTooltip" 
    @mouseout="hideTooltip"
    :style="{ cursor: 'pointer', color: color, fontWeight: fontWeight }"
  >
    {{ teamName }}
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTeamDetailedImageFilename } from '@/utils/teamUtils'

interface Props {
  teamName: string
  color?: string
  fontWeight?: string
}

interface TeamInfo {
  team_id: number
  name: string
  rating: number
  wins: number
  losses: number
  logo_url: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'inherit',
  fontWeight: 'normal'
})

const teamsData = ref<TeamInfo[]>([])

function calculateWinRate(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '0.00'
  return ((wins / total) * 100).toFixed(2)
}

async function loadTeamData() {
  try {
    const response = await fetch('/team_info.json')
    if (response.ok) {
      const data = await response.json()
      teamsData.value = data.teams
    }
  } catch (err) {
    console.error('Error loading team data:', err)
  }
}

function showTooltip(event: MouseEvent) {
  // Remove any existing tooltips first
  hideTooltip()
  
  // Find team data
  const team = teamsData.value.find(t => t.name === props.teamName)
  if (!team) return
  
  // Create tooltip
  const tooltip = document.createElement('div')
  tooltip.className = 'team-name-tooltip'
  tooltip.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    pointer-events: none;
    width: 320px;
    max-width: 90vw;
  `
  
  // Create team header
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    gap: 12px;
  `
  
  // Add team logo
  if (team.logo_url) {
    const logo = document.createElement('img')
    logo.src = team.logo_url
    logo.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid #e1e5e9;
      background-color: #000000;
    `
    header.appendChild(logo)
  }
  
  // Add team name
  const nameDiv = document.createElement('div')
  nameDiv.style.cssText = `
    font-weight: bold;
    font-size: 1.1rem;
    color: #2c3e50;
  `
  nameDiv.textContent = team.name
  header.appendChild(nameDiv)
  
  tooltip.appendChild(header)
  
  // Add detailed image
  const imageContainer = document.createElement('div')
  imageContainer.style.cssText = `
    margin-bottom: 15px;
    text-align: center;
  `
  
  const img = document.createElement('img')
  img.src = `/images/${getTeamDetailedImageFilename(team.name)}`
  img.style.cssText = `
    width: 100%;
    height: auto;
    border-radius: 6px;
    max-height: 180px;
    object-fit: contain;
  `
  imageContainer.appendChild(img)
  tooltip.appendChild(imageContainer)
  
  // Add team stats
  const statsContainer = document.createElement('div')
  statsContainer.style.cssText = `
    background: #f8f9fa;
    border-radius: 6px;
    padding: 12px;
  `
  
  const stats = [
    { label: 'Rating', value: team.rating.toFixed(2) },
    { label: 'Wins', value: team.wins.toString(), color: '#28a745' },
    { label: 'Losses', value: team.losses.toString(), color: '#dc3545' },
    { label: 'Win Rate', value: calculateWinRate(team.wins, team.losses) + '%' }
  ]
  
  stats.forEach((stat, index) => {
    const statRow = document.createElement('div')
    statRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      ${index < stats.length - 1 ? 'border-bottom: 1px solid #e9ecef;' : ''}
    `
    
    const label = document.createElement('span')
    label.style.cssText = `
      font-weight: 600;
      color: #495057;
      font-size: 0.9rem;
    `
    label.textContent = stat.label + ':'
    
    const value = document.createElement('span')
    value.style.cssText = `
      font-weight: bold;
      color: #2c3e50;
      font-size: 0.9rem;
      ${stat.color ? `color: ${stat.color};` : ''}
    `
    value.textContent = stat.value
    
    statRow.appendChild(label)
    statRow.appendChild(value)
    statsContainer.appendChild(statRow)
  })
  
  tooltip.appendChild(statsContainer)
  
  // Position tooltip
  const tooltipWidth = 320
  const tooltipHeight = 350
  let left = event.pageX + 15
  let top = event.pageY - tooltipHeight - 15
  
  // Adjust if tooltip would go off screen
  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - 15
  }
  if (top < 0) {
    top = event.pageY + 15
  }
  
  tooltip.style.left = left + 'px'
  tooltip.style.top = top + 'px'
  
  document.body.appendChild(tooltip)
}

function hideTooltip() {
  const tooltips = document.querySelectorAll('.team-name-tooltip')
  tooltips.forEach(tooltip => tooltip.remove())
}

onMounted(() => {
  loadTeamData()
})
</script>

<style scoped>
.team-name {
  transition: color 0.2s ease;
}

.team-name:hover {
  color: #3b82f6 !important;
}
</style>
