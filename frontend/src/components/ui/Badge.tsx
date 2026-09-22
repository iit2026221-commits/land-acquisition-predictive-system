import type { AssessmentLevel } from '../../types'

export function RiskBadge({ level }: { level: AssessmentLevel }) {
  return <span className={`risk-badge risk-${level.toLowerCase()}`}><span className="status-dot" />{level}</span>
}
