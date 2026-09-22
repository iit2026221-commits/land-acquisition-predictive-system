import type { DashboardData } from '../../types'
import { Card } from '../ui/Card'

export function ProgressCard({ progress }: { progress: DashboardData['progress'] }) {
  return <Card><div className="section-heading"><div><p className="eyebrow">Delivery overview</p><h2>Acquisition progress</h2></div><span className="demo-label">DEMO</span></div><div className="progress-list">{progress.map(item => <div className="progress-item" key={item.label}><div className="progress-meta"><span>{item.label}</span><strong>{item.value}%</strong></div><div className="progress-track"><span style={{ width: `${item.value}%`, background: item.color }} /></div><small>{item.count} in this stage</small></div>)}</div></Card>
}
