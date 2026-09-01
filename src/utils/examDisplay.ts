import type { PassingScore } from '../types'

export function formatPassingScore(passingScore: PassingScore): string {
  if (passingScore.scale === undefined) {
    return `${passingScore.passingScore}%`
  }
  const percent = Math.round((passingScore.passingScore / passingScore.scale) * 100)
  return `${passingScore.passingScore} / ${passingScore.scale} (${percent}%)`
}
