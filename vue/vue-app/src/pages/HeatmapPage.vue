<template>
  <div class="heatmap-page">
    <div class="header">
      <h1>Team Win Probability Heatmap</h1>
      <p>Probability of Team A beating Team B</p>
    </div>

    <div v-if="store.isReady" class="heatmap-container">
      <div ref="heatmapRef" class="heatmap"></div>
      </div>

    <div v-else class="loading">
      <div class="spinner"></div>
      <p>Loading heatmap data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { useHeatmapStore } from '@/stores/heatmap'

const store = useHeatmapStore()
const heatmapRef = ref<HTMLElement>()

// D3 heatmap dimensions
const margin = { top: 120, right: 120, bottom: 160, left: 120 }
const width = 1200
const height = 900
const imageSize = 40 // Size for team images

let svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null

// Function to convert team name to SVG filename
function getTeamImageFilename(teamName: string): string {
  // Map team names to their corresponding SVG filenames
  const nameMap: Record<string, string> = {
    'Team Liquid': 'Team_Liquid.png',
    'PARIVISION': 'PARIVISION.png',
    'BetBoom Team': 'BetBoom_Team.png',
    'Team Tidebound': 'Team_Tidebound.png',
    'Gaimin Gladiators': 'Gaimin_Gladiators.png',
    'Team Spirit': 'Team_Spirit.png',
    'Team Falcons': 'Team_Falcons.png',
    'Tundra Esports': 'Tundra_Esports.png',
    'Natus Vincere': 'Natus_Vincere.png',
    'Nigma Galaxy': 'Nigma_Galaxy.png',
    'Aurora Gaming': 'Aurora_Gaming.png',
    'Xtreme Gaming': 'Xtreme_Gaming.png',
    'Team Nemesis': 'Team_Nemesis.png',
    'BOOM Esports': 'BOOM_Esports.png',
    'Wildcard': 'Wildcard.png',
    'HEROIC': 'HEROIC.png'
  }
  
  return nameMap[teamName] || `${teamName.replace(/\s+/g, '_')}.png`
}

function loadData() {
  // Check if data is already loaded in store
  if (store.isReady) {
    nextTick(() => {
      createHeatmap()
    })
    return
  }

  // Load teams data
  fetch('/teams.json')
    .then(response => response.json())
    .then(data => {
      const teamsData = data.teams
      
      // Load probability matrix
      return fetch('/probMatrix.json')
        .then(response => response.json())
        .then(matrixData => {
          // Store the data
          store.setData(teamsData, matrixData)
          
          // Wait for DOM to be ready before creating heatmap
          nextTick(() => {
            createHeatmap()
          })
        })
    })
    .catch(error => {
      console.error('Error loading data:', error)
    })
}

function createHeatmap() {
  if (!heatmapRef.value || !store.isReady) return

  // Clear previous content
  d3.select(heatmapRef.value).selectAll('*').remove()

  // Create SVG
  svg = d3.select(heatmapRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Create team labels (wrapped for better display)
  const teamLabels = store.teams.map(t => {
    const name = t.name
    // Wrap long names
    if (name.length > 12) {
      return name
    }
    return name
  })

  // Scales
  const xScale = d3.scaleBand()
    .domain(teamLabels)
    .range([0, width])
    .padding(0.05)

  const yScale = d3.scaleBand()
    .domain(teamLabels)
    .range([0, height])
    .padding(0.05)

  const colorScale = d3.scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateGreens)
    .clamp(true)

  // Create heatmap cells
  const cells = svg.selectAll('.cell')
    .data(store.teams.flatMap(teamA => 
      store.teams.map(teamB => ({
        teamA: teamA,
        teamB: teamB,
        probability: store.probMatrix[teamA.team_id.toString()]?.[teamB.team_id.toString()] || 0.5
      }))
    ))
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', (d: any) => {
      const teamBName = d.teamB.name
      const wrappedName = teamBName
      return xScale(wrappedName) || 0
    })
    .attr('y', (d: any) => {
      const teamAName = d.teamA.name
      const wrappedName = teamAName
      return yScale(wrappedName) || 0
    })
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .style('fill', (d: any) => colorScale(d.probability))
    .style('stroke', '#fff')
    .style('stroke-width', 1)
    .on('mouseover', function(event, d: any) {
      d3.select(this).style('stroke-width', 2).style('stroke', '#000')
      
      // Show tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.9)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '6px')
        .style('font-size', '14px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('font-family', 'Arial, sans-serif')
        .style('line-height', '1.4')
      
      tooltip.html(`
        <strong>${d.teamA.name}</strong> vs <strong>${d.teamB.name}</strong><br/>
        Win Probability: <strong>${(d.probability * 100).toFixed(1)}%</strong>
      `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 15) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).style('stroke-width', 1).style('stroke', '#fff')
      d3.selectAll('.tooltip').remove()
    })

  // Add probability text
  svg.selectAll('.cell-text')
    .data(store.teams.flatMap(teamA => 
      store.teams.map(teamB => ({
        teamA: teamA,
        teamB: teamB,
        probability: store.probMatrix[teamA.team_id.toString()]?.[teamB.team_id.toString()] || 0.5
      }))
    ))
    .enter()
    .append('text')
    .attr('class', 'cell-text')
    .attr('x', (d: any) => {
      const teamBName = d.teamB.name
      const wrappedName = teamBName
      return (xScale(wrappedName) || 0) + xScale.bandwidth() / 2
    })
    .attr('y', (d: any) => {
      const teamAName = d.teamA.name
      const wrappedName = teamAName
      return (yScale(wrappedName) || 0) + yScale.bandwidth() / 2
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .style('fill', (d: any) => d.probability < 0.5 ? '#fff' : '#fff')
    .text((d: any) => `${(d.probability * 100).toFixed(1)}%`)

  // Add X-axis (Team B) - on top
  const xAxis = d3.axisTop(xScale)
    .tickFormat((d: any) => d)
    .tickSize(0)

  svg.append('g')
    .attr('class', 'x-axis')
    .style('fill', '#000')
    .style('font-weight', 'bold')
    .call(xAxis)
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(45)')

  // Add Y-axis (Team A)
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d: any) => d)
    .tickSize(0)

  svg.append('g')
    .attr('class', 'y-axis')
    .style('fill', '#000')
    .style('font-weight', 'bold')
    .call(yAxis)
    .selectAll('text')
    .style('text-anchor', 'end')
    .style('font-size', '12px')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')

  // Add axis titles
  svg.append('text')
    .attr('class', 'x-axis-title')
    .attr('text-anchor', 'start')
    .attr('x', 0)
    .attr('y', -margin.top + 40)
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Team B')

  svg.append('text')
    .attr('class', 'y-axis-title')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(0)')
    .attr('y', 0)
    .attr('x', -40)
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Team A')

  // Add main title
  svg.append('text')
    .attr('class', 'main-title')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', -margin.top + 20)
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Head-to-Head Win Probabilities of Team A Beating Team B')

  // Add legend
  const legendWidth = 400
  const legendHeight = 20
  const legendX = (width - legendWidth) / 2
  const legendY = height + 80

  const legendScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, legendWidth])

  const legendAxis = d3.axisBottom(legendScale)
    .tickValues([0, 1])
    .tickFormat((d: any) => `${(d * 100).toFixed(0)}%`)
    .tickSize(5)

  const legendGroup = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legendX},${legendY})`)

// Legend gradient (use the same colorScale)
const defs = svg.append('defs')
const gradient = defs.append('linearGradient')
  .attr('id', 'legend-gradient')
  .attr('x1', '0%').attr('y1', '0%')
  .attr('x2', '100%').attr('y2', '0%')

// sample the scale so it blends smoothly
const stops = 20
for (let i = 0; i <= stops; i++) {
  const t = i / stops
  gradient.append('stop')
    .attr('offset', `${t * 100}%`)
    .attr('stop-color', colorScale(t)) // <— key change
}

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#ffffff')

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#000000')

  legendGroup.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)')
    .style('stroke', '#000')

  legendGroup.append('g')
    .attr('class', 'legend-axis')
    .attr('transform', `translate(0,${legendHeight})`)
    .call(legendAxis)

  legendGroup.append('text')
    .attr('class', 'legend-title')
    .attr('text-anchor', 'middle')
    .attr('x', legendWidth / 2)
    .attr('y', -10)
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('P(A beats B)')

  // Add team images on the right side (Team A)
  svg.selectAll('.team-a-image')
    .data(store.teams)
    .enter()
    .append('image')
    .attr('class', 'team-a-image')
    .attr('x', width + 20)
    .attr('y', (d: any) => {
      const teamAName = d.name
      const wrappedName = teamAName
      return (yScale(wrappedName) || 0) + yScale.bandwidth() / 2 - imageSize / 2
    })
    .attr('width', imageSize)
    .attr('height', imageSize)
    .attr('href', (d: any) => {
      const filename = getTeamImageFilename(d.name)
      return `/images/${filename}`
    })
    .on('error', function() {
      // Hide image if it fails to load
      d3.select(this).style('display', 'none')
    })

  // Add team images on the bottom side (Team B)
  svg.selectAll('.team-b-image')
    .data(store.teams)
    .enter()
    .append('image')
    .attr('class', 'team-b-image')
    .attr('x', (d: any) => {
      const teamBName = d.name
      const wrappedName = teamBName
      return (xScale(wrappedName) || 0) + xScale.bandwidth() / 2 - imageSize / 2
    })
    .attr('y', height + 20)
    .attr('width', imageSize)
    .attr('height', imageSize)
    .attr('href', (d: any) => {
      const filename = getTeamImageFilename(d.name)
      return `/images/${filename}`
    })
    .on('error', function() {
      // Hide image if it fails to load
      d3.select(this).style('display', 'none')
    })
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.heatmap-page {
  max-width: 1600px;
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

.heatmap-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.heatmap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  overflow: auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Tooltip styles */
:global(.tooltip) {
  font-family: Arial, sans-serif;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .heatmap-page {
    padding: 10px;
  }
  
  .heatmap {
    padding: 10px;
    overflow-x: auto;
  }
}
</style>
