<template>
  <div class="heatmap-page">
    <div class="header">
      <h1>Team Win Probability Heatmap</h1>
      <p>Probability of Team A beating Team B</p>
    </div>

    <div v-if="isReady" class="heatmap-container">
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

const heatmapRef = ref<HTMLElement>()
const isReady = ref(false)

// Data storage
let teams: Array<{ team_id: number; name: string }> = []
let probMatrix: Record<string, Record<string, number>> = {}

// D3 heatmap dimensions
const margin = { top: 120, right: 50, bottom: 120, left: 120 }
const width = 900
const height = 700

let svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null

function loadData() {
  // Load teams data
  fetch('/teams.json')
    .then(response => response.json())
    .then(data => {
      teams = data.teams
      
      // Load probability matrix
      return fetch('/probMatrix.json')
    })
    .then(response => response.json())
    .then(matrixData => {
      // Use the data as-is since keys are already strings
      probMatrix = matrixData

      isReady.value = true
      // Wait for DOM to be ready before creating heatmap
      nextTick(() => {
        createHeatmap()
      })
    })
    .catch(error => {
      console.error('Error loading data:', error)
    })
}

function createHeatmap() {
  if (!heatmapRef.value || !isReady.value) return

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
  const teamLabels = teams.map(t => {
    const name = t.name
    // Wrap long names
    if (name.length > 12) {
      return name.replace(/(.{12})/g, '$1\n')
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
    .interpolator(d3.interpolateGreys)
    .clamp(true)

  // Create data for heatmap
  const heatmapData: Array<{ teamA: string; teamB: string; probability: number; teamAId: number; teamBId: number }> = []
  
  teams.forEach(teamA => {
    teams.forEach(teamB => {
      const prob = probMatrix[teamA.team_id.toString()]?.[teamB.team_id.toString()] ?? 0.5
      const labelA = teamA.name.length > 12 ? teamA.name.replace(/(.{12})/g, '$1\n') : teamA.name
      const labelB = teamB.name.length > 12 ? teamB.name.replace(/(.{12})/g, '$1\n') : teamB.name
      
      heatmapData.push({
        teamA: labelA,
        teamB: labelB,
        probability: prob,
        teamAId: teamA.team_id,
        teamBId: teamB.team_id
      })
    })
  })

  // Add cells
  svg.selectAll('.cell')
    .data(heatmapData)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', (d: any) => xScale(d.teamB)!)
    .attr('y', (d: any) => yScale(d.teamA)!)
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('fill', (d: any) => colorScale(d.probability))
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.3)
    .on('mouseover', function(event, d: any) {
      d3.select(this).attr('stroke-width', 2).attr('stroke', '#000')
      
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
      
      // Find team names
      let teamAName = ''
      let teamBName = ''
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].team_id === d.teamAId) teamAName = teams[i].name
        if (teams[i].team_id === d.teamBId) teamBName = teams[i].name
      }
      
      tooltip.html(`
        <strong>${teamAName}</strong> vs <strong>${teamBName}</strong><br/>
        Win Probability: <strong>${(d.probability * 100).toFixed(1)}%</strong>
      `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 15) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke-width', 0.3).attr('stroke', '#fff')
      d3.selectAll('.tooltip').remove()
    })

  // Add probability annotations
  svg.selectAll('.annotation')
    .data(heatmapData)
    .enter()
    .append('text')
    .attr('class', 'annotation')
    .attr('x', (d: any) => xScale(d.teamB)! + xScale.bandwidth() / 2)
    .attr('y', (d: any) => yScale(d.teamA)! + yScale.bandwidth() / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('fill', (d: any) => {
      // For grayscale, use probability to determine text color
      // Low probability (light background) = dark text
      // High probability (dark background) = light text
      return d.probability < 0.5 ? '#000' : '#fff'
    })
    .text((d: any) => d.probability.toFixed(2))

  // Add X axis labels (on top)
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,0)`)
    .call(d3.axisTop(xScale))

  xAxis.selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(45)')
    .style('font-size', '10px')
    .style('fill', '#000')
    .style('font-weight', 'bold')

  // Add Y axis labels
  const yAxis = svg.append('g')
    .call(d3.axisLeft(yScale))

  yAxis.selectAll('text')
    .style('text-anchor', 'end')
    .style('font-size', '10px')
    .style('fill', '#000')
    .style('font-weight', 'bold')

  // Add axis titles
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top + 40)
    .style('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Team B')

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 40)
    .attr('x', -height / 2)
    .style('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Team A')

  // Add main title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top + 20)
    .style('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Head-to-Head Win Probabilities of Team A Beating Team B')

  // Create colorbar
  createColorbar()
}

function createColorbar() {
  if (!svg) return

  const colorbarWidth = 400
  const colorbarHeight = 20
  const colorbarX = (width - colorbarWidth) / 2
  const colorbarY = height + 30

  // Colorbar gradient
  const colorbarGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'colorbar-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')

  colorbarGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', d3.interpolateGreys(0))

  colorbarGradient.append('stop')
    .attr('offset', '50%')
    .attr('stop-color', d3.interpolateGreys(0.5))

  colorbarGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', d3.interpolateGreys(1))

  // Colorbar rectangle
  svg.append('rect')
    .attr('x', colorbarX)
    .attr('y', colorbarY)
    .attr('width', colorbarWidth)
    .attr('height', colorbarHeight)
    .style('fill', 'url(#colorbar-gradient)')
    .style('stroke', '#ccc')

  // Colorbar title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', colorbarY - 10)
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('P(A beats B)')

  // Colorbar labels
  const labels = ['0.00', '0.50', '1.00']
  labels.forEach((label, i) => {
    svg.append('text')
      .attr('x', colorbarX + (colorbarWidth * i) / 2)
      .attr('y', colorbarY + colorbarHeight + 15)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(label)
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.heatmap-page {
  max-width: 1200px;
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
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.heatmap {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
