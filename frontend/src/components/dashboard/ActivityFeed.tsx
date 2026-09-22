import type { DashboardData } from '../../types'
import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'

export function ActivityFeed({ activities }: { activities: DashboardData['activities'] }) {
  return <Card className="activity-card"><div className="section-heading"><div><p className="eyebrow">Audit trail</p><h2>Recent activity</h2></div><button className="icon-button" aria-label="Activity history"><Icon name="clipboard" size={17} /></button></div><div className="activity-list">{activities.map(activity => <div className="activity-item" key={activity.title}><span className={`activity-icon ${activity.kind}`}><Icon name={activity.kind === 'alert' ? 'alert' : activity.kind === 'review' ? 'clipboard' : 'activity'} size={16} /></span><div><strong>{activity.title}</strong><p>{activity.description}</p><small>{activity.time}</small></div></div>)}</div></Card>
}
