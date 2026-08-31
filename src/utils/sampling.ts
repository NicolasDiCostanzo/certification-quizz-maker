import type { Question } from '../types'

type Rng = () => number

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

function allocateQuotas(
  topics: string[],
  capacity: Map<string, number>,
  weightOf: (topic: string) => number,
  total: number,
): Map<string, number> {
  const quotas = new Map<string, number>(topics.map((topic) => [topic, 0]))
  let active = topics.filter((topic) => (capacity.get(topic) ?? 0) > 0)
  let remaining = total

  while (remaining > 0 && active.length > 0) {
    const totalWeight = active.reduce((sum, topic) => sum + weightOf(topic), 0)
    const round = new Map<string, number>(active.map((topic) => [topic, 0]))
    const shares = new Map<string, number>()

    if (totalWeight > 0) {
      for (const topic of active) {
        const share = (remaining * weightOf(topic)) / totalWeight
        shares.set(topic, share)
        round.set(topic, Math.min(Math.floor(share), capacity.get(topic) ?? 0))
      }
    }

    const order = [...active].sort((a, b) => {
      const remainderOf = (topic: string) => (shares.get(topic) ?? 0) % 1
      return remainderOf(b) - remainderOf(a)
    })

    const floorSum = active.reduce((sum, topic) => sum + Math.floor(shares.get(topic) ?? 0), 0)
    const naturalLeftover = totalWeight > 0 ? remaining - floorSum : remaining
    let handedOut = 0
    while (handedOut < naturalLeftover) {
      let progressed = false
      for (const topic of order) {
        if (handedOut >= naturalLeftover) break
        const assigned = round.get(topic) ?? 0
        if (assigned < (capacity.get(topic) ?? 0)) {
          round.set(topic, assigned + 1)
          handedOut += 1
          progressed = true
        }
      }
      if (!progressed) break
    }

    let roundTotal = 0
    for (const [topic, value] of round) {
      quotas.set(topic, (quotas.get(topic) ?? 0) + value)
      roundTotal += value
    }
    remaining -= roundTotal
    active = active.filter((topic) => (round.get(topic) ?? 0) < (capacity.get(topic) ?? 0))
    if (roundTotal === 0) break
  }

  return quotas
}

export function sampleQuestions(
  pool: readonly Question[],
  count: number | 'all',
  weights?: Record<string, number>,
  rng: Rng = Math.random,
): Question[] {
  const shuffled = shuffle(pool, rng)
  const limit = count === 'all' ? shuffled.length : Number.isFinite(count) ? Math.floor(count) : 0
  if (limit <= 0) return []
  if (limit >= shuffled.length) return shuffled
  if (!weights) return shuffled.slice(0, limit)

  const byTopic = new Map<string, Question[]>()
  for (const question of shuffled) {
    const list = byTopic.get(question.topic)
    if (list === undefined) byTopic.set(question.topic, [question])
    else list.push(question)
  }

  const weightOf = (topic: string): number => (Object.hasOwn(weights, topic) ? weights[topic] : 0)
  const topics = [...byTopic.keys()]
  const capacity = new Map<string, number>(topics.map((topic) => [topic, byTopic.get(topic)?.length ?? 0]))
  const totalWeight = topics.reduce((sum, topic) => sum + weightOf(topic), 0)
  if (totalWeight <= 0) return shuffled.slice(0, limit)

  const quotas = allocateQuotas(topics, capacity, weightOf, limit)
  const picked: Question[] = []
  for (const topic of topics) {
    picked.push(...(byTopic.get(topic) ?? []).slice(0, quotas.get(topic) ?? 0))
  }
  return shuffle(picked, rng)
}
