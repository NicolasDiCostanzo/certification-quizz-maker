import { texts } from '../texts/en'

export function groupLabel(group: string): string {
  const label = texts[group as keyof typeof texts]
  return typeof label === 'string' ? label : group
}