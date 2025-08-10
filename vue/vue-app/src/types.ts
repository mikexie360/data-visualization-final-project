export type TeamId = number

// JSON will come in with string keys, so we'll normalize to numbers in code.
export type ProbMatrix = Record<number, Record<number, number>>

export interface Team {
  team_id: TeamId
  name: string
  seed?: number | null
  invitation_type?: string
}

// Tournament simulation types
export interface GameResult {
  game: number
  pA: number
  winner: string
  scoreA_running: number
  scoreB_running: number
}

export interface MatchResult {
  label: string
  best_of: number
  A: { id: number; name: string }
  B: { id: number; name: string }
  games: GameResult[]
  final_score: [number, number]
  winner: { id: number; name: string }
}

export interface SwissRound {
  round: number
  buckets_ids: Record<string, number[]>
  buckets_names: Record<string, string[]>
  pairings: Array<{ A: number; B: number }>
  matches: MatchResult[]
  records_after: Record<number, [number, number]>
}

export interface SwissLog {
  rounds: SwissRound[]
  config: {
    random_seeding: boolean
    pairing_style: string
    seed_order: number[]
  }
}

export interface EliminationRound {
  pairings: Array<{ A: number; B: number }>
  matches: MatchResult[]
  winners: number[]
}

export interface PlayoffLog {
  seeds: number[]
  UB: {
    QF: MatchResult[]
    SF: MatchResult[]
    Final: MatchResult
  }
  LB: {
    R1: MatchResult[]
    R2: MatchResult[]
    QF: MatchResult
    Final: MatchResult
  }
  GF: MatchResult
}

export interface TournamentRun {
  teams: Array<{ id: number; name: string }>
  swiss: {
    rounds: SwissRound[]
    records_final: Record<number, [number, number]>
    rank: {
      order: number[]
      buchholz: Record<number, number>
    }
    config: {
      random_seeding: boolean
      pairing_style: string
      seed_order: number[]
    }
  }
  elimination_round: EliminationRound
  playoffs: PlayoffLog
  champion: { id: number; name: string }
}

export interface SimulationStats {
  title_odds: Array<{
    team_id: number
    team: string
    win_prob: number
  }>
  swiss_probs: Record<number, Record<string, Array<{
    team_id: number
    team: string
    prob: number
  }>>>
  swiss_final_probs: Record<string, Array<{
    team_id: number
    team: string
    prob: number
  }>>
  elim_participation: Array<{
    team_id: number
    team: string
    prob: number
  }>
  elim_advancers: Array<{
    team_id: number
    team: string
    prob: number
  }>
  stage_probs: Record<string, Array<{
    team_id: number
    team: string
    prob: number
  }>>
}
