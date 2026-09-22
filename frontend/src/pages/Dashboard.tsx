import { useEffect, useState } from 'react'
import { getDashboardData } from '../services/dashboardService'
import type { DashboardData } from '../types'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { KpiCard } from '../components/dashboard/KpiCard'
import { ProjectPriorityList } from '../components/dashboard/ProjectPriorityList'
import { ProgressCard } from '../components/dashboard/ProgressCard'
import { RiskSummary } from '../components/dashboard/RiskSummary'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'

export function Dashboard({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { getDashboardData().then(setData).catch(() => setError(true)) }, [])
  return <div className="page"><div className="page-heading"><div><div className="title-line"><p className="eyebrow">National portfolio · Overview</p></div><h1>Executive dashboard</h1><p className="page-subtitle">Live project and risk metrics from the authorized portfolio.</p></div><button className="primary-button" onClick={() => onNavigate?.('/projects/new')}><span>＋</span> Add project</button></div>{error ? <ErrorState /> : !data ? <LoadingState label="Preparing portfolio view" /> : data.projects.length === 0 ? <Card><EmptyState title="No projects yet" message="Create a land acquisition project to populate the live dashboard." /></Card> : <><div className="kpi-grid">{data.kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}</div><div className="dashboard-grid top-grid"><ProgressCard progress={data.progress} /><RiskSummary distribution={data.riskDistribution} /></div><div className="dashboard-grid lower-grid"><ProjectPriorityList projects={data.projects} /><ActivityFeed activities={data.activities} /></div></>}</div>
}

export function PlaceholderPage({ title }: { title: string }) {
  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Part 1 foundation</p><h1>{title}</h1><p className="page-subtitle">This workspace is structured for a later delivery phase.</p></div></div><Card><EmptyState title="Module coming in a later phase" message="Navigation is ready. No business logic has been implemented for this module." /></Card></div>
}
