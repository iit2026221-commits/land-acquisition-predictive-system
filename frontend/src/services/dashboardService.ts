import { getProjects } from './projectService'
import { getPortfolioStatistics } from './projectSelectors'
import { getAssessments } from './riskService'
import { getAuthSession } from './authService'
import type { DashboardData } from '../types'

export async function getDashboardData(): Promise<DashboardData> {
  const projects = await getProjects()
  const stats = getPortfolioStatistics(projects)
  const assessments = getAssessments(projects)
  const session = getAuthSession()
  let backendStats: { project_count: number; high_risk_count: number; average_risk_score: number } | undefined
  if (session) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/dashboard`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
    if (response.ok) backendStats = await response.json() as typeof backendStats
  }
  const distribution = (['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const).map(label => ({
    label,
    value: assessments.filter(assessment => assessment.overallLevel === label).length,
    color: label === 'LOW' ? '#4d9a7d' : label === 'MODERATE' ? '#c28a3b' : label === 'HIGH' ? '#c2614a' : '#9c3f52',
  }))
  return {
    projects,
    riskDistribution: distribution,
    kpis: [
      { label: 'Active projects', value: String(backendStats?.project_count ?? stats.active), detail: `Across ${stats.states} states`, trend: 'Database portfolio count', tone: 'blue' },
      { label: 'Projects at risk', value: String(backendStats?.high_risk_count ?? stats.atRisk), detail: 'High or critical risk category', trend: 'Stored risk assessments', tone: 'amber' },
      { label: 'Critical projects', value: String(assessments.filter(item => item.overallLevel === 'CRITICAL').length).padStart(2, '0'), detail: 'Require immediate intervention', trend: 'Current project assessments', tone: 'red' },
      { label: 'Average risk score', value: backendStats ? `${backendStats.average_risk_score.toFixed(1)}` : stats.averageDelay ? `${stats.averageDelay.toFixed(1)} months` : 'Not assessed', detail: backendStats ? 'Database risk score average' : 'Expected delay is assessed after prediction', trend: backendStats ? 'Live backend metric' : 'Awaiting prediction', tone: 'violet' },
    ],
    progress: [],
    activities: [],
  }
}
