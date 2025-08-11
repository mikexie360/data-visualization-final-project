import { createRouter, createWebHistory } from 'vue-router'

const HeatmapPage = () => import('../pages/HeatmapPage.vue')
const SimulatorPage = () => import('../pages/SimulatorPage.vue')
const TeamStatsPage = () => import('../pages/TeamStatsPage.vue')

const router = createRouter({
  history: createWebHistory(), // ✅ safer base
  routes: [
    { path: '/', name: 'heatmap', component: HeatmapPage },
    { path: '/sim', name: 'sim', component: SimulatorPage },
    { path: '/teams', name: 'teams', component: TeamStatsPage },
  ],
})

export default router
