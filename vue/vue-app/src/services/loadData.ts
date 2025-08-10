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

export async function loadAll(): Promise<{ teams: Team[]; matrix: ProbMatrix }> {
  const [teamsRes, matrixRes] = await Promise.all([
    fetch('/teams.json'),
    fetch('/prob_matrix.json'),
  ])
  const teamsJson = await teamsRes.json()
  const matrixJson = await matrixRes.json()

  return {
    teams: (teamsJson.teams ?? teamsJson) as Team[],
    matrix: keysToNumber(matrixJson) as ProbMatrix,
  }
}
