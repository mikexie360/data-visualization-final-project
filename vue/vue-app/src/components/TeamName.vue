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
import { ref } from 'vue'
import { getTeamDetailedImageFilename } from '@/utils/teamUtils'

interface Props {
  teamName: string
  color?: string
  fontWeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'inherit',
  fontWeight: 'normal'
})

function showTooltip(event: MouseEvent) {
  // Remove any existing tooltips first
  hideTooltip()
  
  // Create tooltip
  const tooltip = document.createElement('div')
  tooltip.className = 'team-name-tooltip'
  tooltip.style.cssText = `
    position: absolute;
    background: white;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 1000;
    pointer-events: none;
  `
  
  // Add detailed image
  const img = document.createElement('img')
  img.src = `/images/${getTeamDetailedImageFilename(props.teamName)}`
  img.style.cssText = `
    width: 200px;
    height: auto;
    display: block;
  `
  tooltip.appendChild(img)
  
  // Add team name
  const nameDiv = document.createElement('div')
  nameDiv.style.cssText = `
    text-align: center;
    margin-top: 5px;
    font-weight: bold;
    font-size: 12px;
  `
  nameDiv.textContent = props.teamName
  tooltip.appendChild(nameDiv)
  
  // Position tooltip
  const tooltipWidth = 220
  const tooltipHeight = 250
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
</script>

<style scoped>
.team-name {
  transition: color 0.2s ease;
}

.team-name:hover {
  color: #3b82f6 !important;
}
</style>
