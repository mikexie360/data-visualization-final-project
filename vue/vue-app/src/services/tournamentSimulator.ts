import type { Team, ProbMatrix } from '@/types'

// Types for tournament simulation
export interface GameResult {
  game: number
  pA: number
  winner: string
  scoreA_running: number
  scoreB_running: number
}

export interface SeriesLog {
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
  matches: SeriesLog[]
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

export interface EliminationLog {
  pairings: Array<{ A: number; B: number }>
  matches: SeriesLog[]
  winners: number[]
}

export interface PlayoffLog {
  seeds: number[]
  UB: {
    QF: SeriesLog[]
    SF: SeriesLog[]
    Final: SeriesLog
  }
  LB: {
    R1: SeriesLog[]
    R2: SeriesLog[]
    QF: SeriesLog
    Final: SeriesLog
  }
  GF: SeriesLog
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
  elimination_round: EliminationLog
  playoffs: PlayoffLog
  champion: { id: number; name: string }
}

export interface SimulationStats {
  title_odds: Array<{ team_id: number; team: string; win_prob: number }>
  swiss_probs: Record<number, Record<string, Array<{ team_id: number; team: string; prob: number }>>>
  swiss_final_probs: Record<string, Array<{ team_id: number; team: string; prob: number }>>
  elim_participation: Array<{ team_id: number; team: string; prob: number }>
  elim_advancers: Array<{ team_id: number; team: string; prob: number }>
  stage_probs: Record<string, Array<{ team_id: number; team: string; prob: number }>>
}

export interface SimulationConfig {
  random_seeding: boolean
  pairing_style: '1v16' | 'adjacent'
  seed_order?: number[]
  num_simulations: number
  verbose: boolean
}

export type ProgressCallback = (current: number, stage: string) => void

// Custom RNG for reproducible results
class CustomRNG {
  private seed: number
  private state: number

  constructor(seed: number) {
    this.seed = seed
    this.state = seed
  }

  random(): number {
    this.state = (this.state * 9301 + 49297) % 233280
    return this.state / 233280
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

export class TournamentSimulator {
  private teams: Team[]
  private probMatrix: ProbMatrix
  private rng: CustomRNG
  private idToName: Map<number, string>

  constructor(teams: Team[], probMatrix: ProbMatrix, seed: number = 42) {
    this.teams = teams
    this.probMatrix = probMatrix
    this.rng = new CustomRNG(seed)
    this.idToName = new Map(teams.map(t => [t.team_id, t.name]))
  }

  private coerce01(x: number): number {
    return Math.min(1.0, Math.max(0.0, x))
  }

  private pA(aId: number, bId: number): number {
    if (aId === bId) return 0.5
    return this.probMatrix[aId]?.[bId] ?? 0.5
  }

  private playGame(aId: number, bId: number): [boolean, number] {
    const p = this.pA(aId, bId)
    const winA = this.rng.random() < p
    return [winA, p]
  }

  private playBoN(aId: number, bId: number, N: number, label: string): [number, number, number, SeriesLog] {
    const need = Math.floor(N / 2) + 1
    let aWins = 0
    let bWins = 0
    const games: GameResult[] = []
    let gameNum = 0

    while (aWins < need && bWins < need) {
      gameNum++
      const [winA, p] = this.playGame(aId, bId)
      if (winA) aWins++
      else bWins++

      games.push({
        game: gameNum,
        pA: p,
        winner: winA ? this.idToName.get(aId)! : this.idToName.get(bId)!,
        scoreA_running: aWins,
        scoreB_running: bWins
      })
    }

    const winner = aWins > bWins ? aId : bId
    const seriesLog: SeriesLog = {
      label,
      best_of: N,
      A: { id: aId, name: this.idToName.get(aId)! },
      B: { id: bId, name: this.idToName.get(bId)! },
      games,
      final_score: [aWins, bWins],
      winner: { id: winner, name: this.idToName.get(winner)! }
    }

    return [winner, aWins, bWins, seriesLog]
  }

  private playBo3(aId: number, bId: number, label: string): [number, number, number, SeriesLog] {
    return this.playBoN(aId, bId, 3, label)
  }

  private playBo5(aId: number, bId: number, label: string): [number, number, number, SeriesLog] {
    return this.playBoN(aId, bId, 5, label)
  }

  private keyPair(a: number, b: number): [number, number] {
    return a < b ? [a, b] : [b, a]
  }

  private pairBucketStrict(
    bucketTeams: number[], 
    played: Set<string>, 
    seedOrder?: number[], 
    pairingStyle?: '1v16' | 'adjacent'
  ): Array<[number, number]> {
    const teams = [...bucketTeams]
    if (teams.length % 2 !== 0) {
      throw new Error(`Bucket has odd size ${teams.length}; Swiss should keep buckets even.`)
    }

    // If we have seeding order and pairing style, use them for structured pairing
    if (seedOrder && pairingStyle) {
      // Filter seed order to only include teams in this bucket
      const orderedTeams = seedOrder.filter(t => teams.includes(t))
      
      if (orderedTeams.length === teams.length) {
        // Try to pair according to the pairing style
        const pairs: Array<[number, number]> = []
        
        if (pairingStyle === '1v16') {
          // Pair best vs worst within the bucket
          for (let i = 0; i < orderedTeams.length / 2; i++) {
            const a = orderedTeams[i]
            const b = orderedTeams[orderedTeams.length - 1 - i]
            const key = `${Math.min(a, b)}-${Math.max(a, b)}`
            if (!played.has(key)) {
              pairs.push([a, b])
            } else {
              // If this pair has already played, fall back to random
              break
            }
          }
        } else if (pairingStyle === 'adjacent') {
          // Pair adjacent teams within the bucket
          for (let i = 0; i < orderedTeams.length; i += 2) {
            const a = orderedTeams[i]
            const b = orderedTeams[i + 1]
            const key = `${Math.min(a, b)}-${Math.max(a, b)}`
            if (!played.has(key)) {
              pairs.push([a, b])
            } else {
              // If this pair has already played, fall back to random
              break
            }
          }
        }
        
        // If we successfully paired all teams without rematches, return the pairs
        if (pairs.length === teams.length / 2) {
          return pairs
        }
      }
    }

    // Fallback to random pairing (original logic)
    for (let attempt = 0; attempt < 200; attempt++) {
      const shuffled = this.rng.shuffle(teams)
      let ok = true
      const pairs: Array<[number, number]> = []

      for (let i = 0; i < shuffled.length; i += 2) {
        const a = shuffled[i]
        const b = shuffled[i + 1]
        const key = `${a}-${b}`
        if (played.has(key)) {
          ok = false
          break
        }
        pairs.push([a, b])
      }

      if (ok) {
        return pairs
      }
    }

    // Final fallback: allow rematch minimally
    const pairs: Array<[number, number]> = []
    for (let i = 0; i < teams.length; i += 2) {
      pairs.push([teams[i], teams[i + 1]])
    }
    return pairs
  }

  private swissGroupStage(
    teamIds: number[],
    config: SimulationConfig
  ): [Record<number, [number, number]>, Record<number, number[]>, SwissLog] {
    const records: Record<number, [number, number]> = {}
    const opponents: Record<number, number[]> = {}
    const played = new Set<string>()

    // Initialize records and opponents
    for (const tid of teamIds) {
      records[tid] = [0, 0]
      opponents[tid] = []
    }

    const swissLog: SwissLog = {
      rounds: [],
      config: {
        random_seeding: config.random_seeding,
        pairing_style: config.pairing_style,
        seed_order: config.seed_order || []
      }
    }

    // Play exactly 5 rounds
    for (let round = 1; round <= 5; round++) {
      // Active teams that haven't reached 4W/4L yet
      const active = teamIds.filter(t => {
        const [w, l] = records[t]
        return w < 4 && l < 4
      })

      // Group active teams by current record
      const buckets = new Map<string, number[]>()
      for (const t of active) {
        const [w, l] = records[t]
        const key = `${w}-${l}`
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key)!.push(t)
      }

      // Snapshot buckets before pairings
      const bucketIds: Record<string, number[]> = {}
      const bucketNames: Record<string, string[]> = {}
      for (const [key, tids] of buckets) {
        bucketIds[key] = [...tids]
        bucketNames[key] = tids.map(t => this.idToName.get(t)!)
      }

      // Pairings
      const roundPairs: Array<[number, number]> = []

      if (round === 1) {
        const s = buckets.get('0-0') || []
        if (s.length !== 16) {
          throw new Error(`Round-1 expects all 16 teams at 0-0, got ${s.length}`)
        }

        if (config.random_seeding) {
          const shuffled = this.rng.shuffle(s)
          if (config.pairing_style === '1v16') {
            // Pair best vs worst within the shuffled array
            for (let i = 0; i < 8; i++) {
              roundPairs.push([shuffled[i], shuffled[shuffled.length - 1 - i]])
            }
          } else if (config.pairing_style === 'adjacent') {
            // Pair adjacent teams within the shuffled array
            for (let i = 0; i < 16; i += 2) {
              roundPairs.push([shuffled[i], shuffled[i + 1]])
            }
          }
        } else {
          const useOrder = config.seed_order || []
          if (useOrder.length === 0) {
            throw new Error('No seed_order provided')
          }
          const ordered = useOrder.filter(t => s.includes(t))
          if (config.pairing_style === '1v16') {
            for (let i = 0; i < 8; i++) {
              roundPairs.push([ordered[i], ordered[ordered.length - 1 - i]])
            }
          } else if (config.pairing_style === 'adjacent') {
            for (let i = 0; i < 16; i += 2) {
              roundPairs.push([ordered[i], ordered[i + 1]])
            }
          }
        }
      } else {
        // R2..R5: strictly same-record pairings, higher-win buckets first
        const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => {
          const [wa, la] = a[0].split('-').map(Number)
          const [wb, lb] = b[0].split('-').map(Number)
          if (wa !== wb) return wb - wa // higher wins first
          return la - lb // lower losses first
        })

        for (const [_, group] of sortedBuckets) {
          if (group.length === 0) continue
          if (group.length % 2 !== 0) {
            throw new Error(`Bucket has odd size ${group.length}`)
          }
          const pairs = this.pairBucketStrict(group, played, config.seed_order, config.pairing_style)
          roundPairs.push(...pairs)
        }
      }

      // Play matches
      const matchesLog: SeriesLog[] = []
      for (let idx = 0; idx < roundPairs.length; idx++) {
        const [a, b] = roundPairs[idx]
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`
        played.add(key)

        const label = `Swiss R${round} M${idx + 1}: ${this.idToName.get(a)} vs ${this.idToName.get(b)}`
        const [winner, wa, wb, seriesLog] = this.playBo3(a, b, label)
        const loser = winner === a ? b : a

        records[winner][0]++
        records[loser][1]++
        opponents[a].push(b)
        opponents[b].push(a)
        matchesLog.push(seriesLog)
      }

      swissLog.rounds.push({
        round,
        buckets_ids: bucketIds,
        buckets_names: bucketNames,
        pairings: roundPairs.map(([a, b]) => ({ A: a, B: b })),
        matches: matchesLog,
        records_after: { ...records }
      })
    }

    return [records, opponents, swissLog]
  }

  private swissRank(
    records: Record<number, [number, number]>,
    opponents: Record<number, number[]>
  ): [number[], { order: number[]; buchholz: Record<number, number> }] {
    // Calculate Buchholz scores
    const oppWins: Record<number, number> = {}
    for (const [t, opps] of Object.entries(opponents)) {
      const tid = parseInt(t)
      oppWins[tid] = opps.reduce((sum, o) => sum + records[o][0], 0)
    }

    // Sort by wins desc, losses asc, Buchholz desc, then random
    const items = Object.entries(records).map(([tid, [w, l]]) => ({
      tid: parseInt(tid),
      wins: w,
      losses: l,
      buchholz: oppWins[parseInt(tid)]
    }))

    // Add randomness for ties
    items.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.losses !== b.losses) return a.losses - b.losses
      if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz
      return this.rng.random() - 0.5
    })

    const order = items.map(item => item.tid)
    const buchholz = Object.fromEntries(items.map(item => [item.tid, item.buchholz]))

    return [order, { order, buchholz }]
  }

  private eliminationRound(swissOrder: number[]): [number[], EliminationLog] {
    // Teams ranked 4..13 play: 4v13, 5v12, 6v11, 7v10, 8v9
    const playIds = swissOrder.slice(3, 13)
    const pairings: Array<[number, number]> = [
      [playIds[0]!, playIds[9]!],
      [playIds[1]!, playIds[8]!],
      [playIds[2]!, playIds[7]!],
      [playIds[3]!, playIds[6]!],
      [playIds[4]!, playIds[5]!]
    ]

    const winners: number[] = []
    const elimLog: EliminationLog = {
      pairings: [],
      matches: [],
      winners: []
    }

    for (const [a, b] of pairings) {
      const label = `Elim: ${this.idToName.get(a)} vs ${this.idToName.get(b)}`
      const [w, wa, wb, seriesLog] = this.playBo3(a, b, label)
      winners.push(w)
      elimLog.pairings.push({ A: a, B: b })
      elimLog.matches.push(seriesLog)
    }

    elimLog.winners = winners
    return [winners, elimLog]
  }

  private simulatePlayoffs(swissOrder: number[], elimWinners: number[]): [number, PlayoffLog] {
    const top3 = swissOrder.slice(0, 3)
    const playoffTeams = [...top3, ...elimWinners]
    const order = Object.fromEntries(swissOrder.map((tid, i) => [tid, i]))
    playoffTeams.sort((a, b) => order[a] - order[b])
    const seeds = playoffTeams

    const log: PlayoffLog = {
      seeds,
      UB: { QF: [], SF: [], Final: {} as SeriesLog },
      LB: { R1: [], R2: [], QF: {} as SeriesLog, Final: {} as SeriesLog },
      GF: {} as SeriesLog
    }

    // UB QF
    const qfPairs: Array<[number, number]> = [
      [seeds[0], seeds[7]],
      [seeds[3], seeds[4]],
      [seeds[2], seeds[5]],
      [seeds[1], seeds[6]]
    ]

    const ubQfWinners: number[] = []
    const lbLosses: number[] = []

    for (const [a, b] of qfPairs) {
      const label = `UB QF: ${this.idToName.get(a)} vs ${this.idToName.get(b)}`
      const [w, wa, wb, seriesLog] = this.playBo3(a, b, label)
      const l = w === a ? b : a
      ubQfWinners.push(w)
      lbLosses.push(l)
      log.UB.QF.push(seriesLog)
    }

    // UB SF
    const ubSfPairs: Array<[number, number]> = [
      [ubQfWinners[0], ubQfWinners[1]],
      [ubQfWinners[2], ubQfWinners[3]]
    ]

    const ubSfWinners: number[] = []
    for (const [a, b] of ubSfPairs) {
      const label = `UB SF: ${this.idToName.get(a)} vs ${this.idToName.get(b)}`
      const [w, wa, wb, seriesLog] = this.playBo3(a, b, label)
      const l = w === a ? b : a
      ubSfWinners.push(w)
      lbLosses.push(l)
      log.UB.SF.push(seriesLog)
    }

    // UB Final
    const [ubFinalA, ubFinalB] = ubSfWinners
    const ubFinalLabel = `UB Final: ${this.idToName.get(ubFinalA)} vs ${this.idToName.get(ubFinalB)}`
    const [ubFinalW, ubFinalWa, ubFinalWb, ubFinalLog] = this.playBo3(ubFinalA, ubFinalB, ubFinalLabel)
    const ubFinalL = ubFinalW === ubFinalA ? ubFinalB : ubFinalA
    lbLosses.push(ubFinalL)
    log.UB.Final = ubFinalLog

    // LB R1
    const lb = [...lbLosses]
    const lbR1Pairs: Array<[number, number]> = [
      [lb[0], lb[1]],
      [lb[2], lb[3]]
    ]

    const lbR1W: number[] = []
    for (const [a, b] of lbR1Pairs) {
      const label = `LB R1: ${this.idToName.get(a)} vs ${this.idToName.get(b)}`
      const [w, wa, wb, seriesLog] = this.playBo3(a, b, label)
      lbR1W.push(w)
      log.LB.R1.push(seriesLog)
    }

    // LB R2
    const sfLosers = lb.slice(4, 6)
    const lbR2Pairs: Array<[number, number]> = [
      [lbR1W[0], sfLosers[0]],
      [lbR1W[1], sfLosers[1]]
    ]

    const lbR2W: number[] = []
    for (const [a, b] of lbR2Pairs) {
      const label = `LB R2: ${this.idToName.get(a)} vs ${this.idToName.get(b)}`
      const [w, wa, wb, seriesLog] = this.playBo3(a, b, label)
      lbR2W.push(w)
      log.LB.R2.push(seriesLog)
    }

    // LB QF
    const [lbQfA, lbQfB] = lbR2W
    const lbQfLabel = `LB QF: ${this.idToName.get(lbQfA)} vs ${this.idToName.get(lbQfB)}`
    const [lbQfW, wa, wb, lbQfLog] = this.playBo3(lbQfA, lbQfB, lbQfLabel)
    log.LB.QF = lbQfLog

    // LB Final
    const lbFinalLabel = `LB Final: ${this.idToName.get(lbQfW)} vs ${this.idToName.get(ubFinalL)}`
    const [lbFinalW, lbFinalWa, lbFinalWb, lbFinalLog] = this.playBo3(lbQfW, ubFinalL, lbFinalLabel)
    log.LB.Final = lbFinalLog

    // Grand Final (Bo5)
    const gfLabel = `Grand Final: ${this.idToName.get(ubFinalW)} vs ${this.idToName.get(lbFinalW)}`
    const [champion, gfWa, gfWb, gfLog] = this.playBo5(ubFinalW, lbFinalW, gfLabel)
    log.GF = gfLog

    return [champion, log]
  }

  public async simulateOnce(config: SimulationConfig, onProgress?: ProgressCallback): Promise<[number, TournamentRun]> {
    const teamIds = this.teams.map(t => t.team_id)
    const runLog: TournamentRun = {
      teams: this.teams.map(t => ({ id: t.team_id, name: t.name })),
      swiss: {} as any,
      elimination_round: {} as any,
      playoffs: {} as any,
      champion: {} as any
    }

    // Swiss Stage
    onProgress?.(0, 'Swiss Stage - Round 1')
    const [records, opponents, swissLog] = this.swissGroupStage(teamIds, config)
    onProgress?.(0, 'Swiss Stage - Ranking')
    const [order, rankLog] = this.swissRank(records, opponents)
    runLog.swiss = {
      rounds: swissLog.rounds,
      records_final: { ...records },
      rank: rankLog,
      config: swissLog.config
    }

    // Elimination Round
    onProgress?.(0, 'Elimination Round')
    const [elimWinners, elimLog] = this.eliminationRound(order)
    runLog.elimination_round = elimLog

    // Playoffs
    onProgress?.(0, 'Playoffs - Upper Bracket')
    const [champion, poLog] = this.simulatePlayoffs(order, elimWinners)
    runLog.playoffs = poLog
    runLog.champion = { id: champion, name: this.idToName.get(champion)! }

    onProgress?.(1, 'Complete')
    return [champion, runLog]
  }

  public async monteCarlo(config: SimulationConfig, onProgress?: ProgressCallback): Promise<[Array<{ team_id: number; team: string; win_prob: number }>, TournamentRun[], SimulationStats]> {
    const { num_simulations } = config
    const champs: number[] = []
    const logs: TournamentRun[] = []

    // Counters for statistics
    const swissBucketCounts = new Map<number, Map<string, Map<number, number>>>()
    const swissFinalCounts = new Map<string, Map<number, number>>()
    const elimParticipation = new Map<number, number>()
    const elimAdvancers = new Map<number, number>()
    const stageCounts = new Map<string, Map<number, number>>()

    // Initialize counters
    for (let r = 1; r <= 5; r++) {
      swissBucketCounts.set(r, new Map())
    }
    const stages = ['UB_QF', 'UB_SF', 'UB_Final', 'LB_R1', 'LB_R2', 'LB_QF', 'LB_Final', 'GF', 'Champion']
    for (const stage of stages) {
      stageCounts.set(stage, new Map())
    }

    for (let i = 0; i < num_simulations; i++) {
      onProgress?.(i + 1, `Tournament ${i + 1}/${num_simulations}`)
      const [champ, runLog] = await this.simulateOnce(config, (current, stage) => {
        onProgress?.(i + 1, `Tournament ${i + 1}/${num_simulations} - ${stage}`)
      })
      champs.push(champ)
      logs.push(runLog)

      // Aggregate statistics
      this.aggregateFromRunLog(runLog, swissBucketCounts, swissFinalCounts, elimParticipation, elimAdvancers, stageCounts)
      
      // Add a small delay to make progress visible (only for larger simulations)
      if (num_simulations > 10 && i % Math.max(1, Math.floor(num_simulations / 100)) === 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }

    // Build statistics
    const stats = this.buildStatsFromLogs(logs, num_simulations, swissBucketCounts, swissFinalCounts, elimParticipation, elimAdvancers, stageCounts)

    // Title odds
    const champCounts = new Map<number, number>()
    for (const champ of champs) {
      champCounts.set(champ, (champCounts.get(champ) || 0) + 1)
    }

    const titleOdds = this.teams.map(team => ({
      team_id: team.team_id,
      team: team.name,
      win_prob: (champCounts.get(team.team_id) || 0) / num_simulations
    })).sort((a, b) => b.win_prob - a.win_prob)

    stats.title_odds = titleOdds

    return [titleOdds, logs, stats]
  }

  private aggregateFromRunLog(
    runLog: TournamentRun,
    swissBucketCounts: Map<number, Map<string, Map<number, number>>>,
    swissFinalCounts: Map<string, Map<number, number>>,
    elimParticipation: Map<number, number>,
    elimAdvancers: Map<number, number>,
    stageCounts: Map<string, Map<number, number>>
  ) {
    // Swiss buckets
    for (const round of runLog.swiss.rounds) {
      const rnum = round.round
      if (!swissBucketCounts.has(rnum)) {
        swissBucketCounts.set(rnum, new Map())
      }
      const roundBuckets = swissBucketCounts.get(rnum)!

      for (const [bucketStr, tids] of Object.entries(round.buckets_ids)) {
        if (!roundBuckets.has(bucketStr)) {
          roundBuckets.set(bucketStr, new Map())
        }
        const bucket = roundBuckets.get(bucketStr)!

        for (const tid of tids) {
          bucket.set(tid, (bucket.get(tid) || 0) + 1)
        }
      }
    }

    // Swiss final buckets
    for (const [tid, [w, l]] of Object.entries(runLog.swiss.records_final)) {
      const key = `${w}-${l}`
      if (!swissFinalCounts.has(key)) {
        swissFinalCounts.set(key, new Map())
      }
      const bucket = swissFinalCounts.get(key)!
      bucket.set(parseInt(tid), (bucket.get(parseInt(tid)) || 0) + 1)
    }

    // Elimination participation and advancement
    const order = runLog.swiss.rank.order
    for (const tid of order.slice(3, 13)) {
      elimParticipation.set(tid, (elimParticipation.get(tid) || 0) + 1)
    }
    for (const tid of runLog.elimination_round.winners) {
      elimAdvancers.set(tid, (elimAdvancers.get(tid) || 0) + 1)
    }

    // Playoff stages
    const po = runLog.playoffs

    // UB QF: all 8 seeds
    for (const tid of po.seeds) {
      const ubQf = stageCounts.get('UB_QF')!
      ubQf.set(tid, (ubQf.get(tid) || 0) + 1)
    }

    // UB SF participants
    for (const s of po.UB.SF) {
      const ubSf = stageCounts.get('UB_SF')!
      ubSf.set(s.A.id, (ubSf.get(s.A.id) || 0) + 1)
      ubSf.set(s.B.id, (ubSf.get(s.B.id) || 0) + 1)
    }

    // UB Final participants
    const ubFinal = stageCounts.get('UB_Final')!
    ubFinal.set(po.UB.Final.A.id, (ubFinal.get(po.UB.Final.A.id) || 0) + 1)
    ubFinal.set(po.UB.Final.B.id, (ubFinal.get(po.UB.Final.B.id) || 0) + 1)

    // LB rounds participants
    for (const s of po.LB.R1) {
      const lbR1 = stageCounts.get('LB_R1')!
      lbR1.set(s.A.id, (lbR1.get(s.A.id) || 0) + 1)
      lbR1.set(s.B.id, (lbR1.get(s.B.id) || 0) + 1)
    }

    for (const s of po.LB.R2) {
      const lbR2 = stageCounts.get('LB_R2')!
      lbR2.set(s.A.id, (lbR2.get(s.A.id) || 0) + 1)
      lbR2.set(s.B.id, (lbR2.get(s.B.id) || 0) + 1)
    }

    const lbQf = stageCounts.get('LB_QF')!
    lbQf.set(po.LB.QF.A.id, (lbQf.get(po.LB.QF.A.id) || 0) + 1)
    lbQf.set(po.LB.QF.B.id, (lbQf.get(po.LB.QF.B.id) || 0) + 1)

    const lbFinal = stageCounts.get('LB_Final')!
    lbFinal.set(po.LB.Final.A.id, (lbFinal.get(po.LB.Final.A.id) || 0) + 1)
    lbFinal.set(po.LB.Final.B.id, (lbFinal.get(po.LB.Final.B.id) || 0) + 1)

    // Grand Final + Champion
    const gf = stageCounts.get('GF')!
    gf.set(po.GF.A.id, (gf.get(po.GF.A.id) || 0) + 1)
    gf.set(po.GF.B.id, (gf.get(po.GF.B.id) || 0) + 1)

    const champion = stageCounts.get('Champion')!
    champion.set(runLog.champion.id, (champion.get(runLog.champion.id) || 0) + 1)
  }

  private buildStatsFromLogs(
    logs: TournamentRun[],
    N: number,
    swissBucketCounts: Map<number, Map<string, Map<number, number>>>,
    swissFinalCounts: Map<string, Map<number, number>>,
    elimParticipation: Map<number, number>,
    elimAdvancers: Map<number, number>,
    stageCounts: Map<string, Map<number, number>>
  ): SimulationStats {
    // Convert counters to arrays
    const swissProbs: Record<number, Record<string, Array<{ team_id: number; team: string; prob: number }>>> = {}
    for (let r = 1; r <= 5; r++) {
      if (swissBucketCounts.has(r)) {
        swissProbs[r] = {}
        const roundBuckets = swissBucketCounts.get(r)!
        for (const [bucket, teamCounts] of roundBuckets) {
          swissProbs[r][bucket] = Array.from(teamCounts.entries()).map(([tid, count]) => ({
            team_id: tid,
            team: this.idToName.get(tid)!,
            prob: count / N
          })).sort((a, b) => b.prob - a.prob)
        }
      }
    }

    const swissFinalProbs: Record<string, Array<{ team_id: number; team: string; prob: number }>> = {}
    for (const [bucket, teamCounts] of swissFinalCounts) {
      swissFinalProbs[bucket] = Array.from(teamCounts.entries()).map(([tid, count]) => ({
        team_id: tid,
        team: this.idToName.get(tid)!,
        prob: count / N
      })).sort((a, b) => b.prob - a.prob)
    }

    const elimParticipationArray = Array.from(elimParticipation.entries()).map(([tid, count]) => ({
      team_id: tid,
      team: this.idToName.get(tid)!,
      prob: count / N
    })).sort((a, b) => b.prob - a.prob)

    const elimAdvancersArray = Array.from(elimAdvancers.entries()).map(([tid, count]) => ({
      team_id: tid,
      team: this.idToName.get(tid)!,
      prob: count / N
    })).sort((a, b) => b.prob - a.prob)

    const stageProbs: Record<string, Array<{ team_id: number; team: string; prob: number }>> = {}
    for (const [stage, teamCounts] of stageCounts) {
      stageProbs[stage] = Array.from(teamCounts.entries()).map(([tid, count]) => ({
        team_id: tid,
        team: this.idToName.get(tid)!,
        prob: count / N
      })).sort((a, b) => b.prob - a.prob)
    }

    return {
      title_odds: [],
      swiss_probs: swissProbs,
      swiss_final_probs: swissFinalProbs,
      elim_participation: elimParticipationArray,
      elim_advancers: elimAdvancersArray,
      stage_probs: stageProbs
    }
  }
}
