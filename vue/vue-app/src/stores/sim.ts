import { defineStore } from 'pinia'
import type { ProbMatrix, Team } from '@/types'

export const useSimStore = defineStore('sim', {
  state: () => ({
    teams: [] as Team[],
    probMatrix: {} as ProbMatrix, // A beats B ⇒ probMatrix[A][B]
    loaded: false,
  }),
  getters: {
    idToName: (s) => {
      const map = new Map<number, string>()
      s.teams.forEach(t => map.set(t.team_id, t.name))
      return map
    },
    teamIds: (s) => s.teams.map(t => t.team_id),
  },
  actions: {
    setData(teams: Team[], matrix: ProbMatrix) {
      this.teams = teams
      this.probMatrix = matrix
      this.loaded = true
    },
  },
})
