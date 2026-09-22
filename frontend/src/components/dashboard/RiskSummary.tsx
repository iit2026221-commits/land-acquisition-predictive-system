import type { DashboardData } from '../../types'
import { Card } from '../ui/Card'
import { RiskBadge } from '../ui/Badge'

export function RiskSummary({ distribution }: { distribution: DashboardData['riskDistribution'] }) {
  const total = distribution.reduce((sum, item) => sum + item.value, 0)
  let accumulated = 0
  const gradient = distribution.map(item => {
    const start = accumulated
    accumulated += total ? item.value / total * 100 : 0
    return `${item.color} ${start}% ${accumulated}%`
  }).join(', ')
  return <Card className="risk-card"><div className="section-heading"><div><p className="eyebrow">Portfolio signal</p><h2>Risk distribution</h2></div><button className="text-button">View analysis <span>→</span></button></div><div className="risk-content"><div className="donut" style={{ background: `conic-gradient(${gradient})` }}><div><strong>{total}</strong><span>projects</span></div></div><div className="risk-legend">{distribution.map(item => <div className="legend-row" key={item.label}><RiskBadge level={item.label} /><strong>{item.value}</strong><span>{Math.round(item.value / total * 100)}%</span></div>)}</div></div><div className="risk-caption"><span className="signal-line" />Risk levels are calculated from the demonstration dataset and are not official assessments.</div></Card>
}
