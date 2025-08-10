export type TeamId = number

// JSON will come in with string keys, so we'll normalize to numbers in code.
export type ProbMatrix = Record<number, Record<number, number>>

export interface Team {
  team_id: TeamId
  name: string
  seed?: number | null
}
