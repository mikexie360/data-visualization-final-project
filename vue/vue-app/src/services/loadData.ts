import type { ProbMatrix, Team } from '@/types'

function keysToNumber(obj: Record<string, any>): any {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const out: Record<number, any> = {}
    for (const [k, v] of Object.entries(obj)) {
      const nk = Number.isNaN(Number(k)) ? k : Number(k)
      out[nk as any] = keysToNumber(v)
    }
    return out
  }
  if (Array.isArray(obj)) return obj.map(keysToNumber)
  return obj
}

export async function loadTeams(): Promise<Team[]> {
  const response = await fetch('/teams.json')
  const data = await response.json()
  return data.teams as Team[]
}

export async function loadProbMatrix(): Promise<ProbMatrix> {
  const response = await fetch('/probMatrix.json')
  const data = await response.json()
  return data as ProbMatrix
}

export async function loadAll(): Promise<{ teams: Team[]; matrix: ProbMatrix }> {
  const [teams, matrix] = await Promise.all([
    loadTeams(),
    loadProbMatrix()
  ])
  return { teams, matrix }
}
