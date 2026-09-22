import type { DashboardData } from '../types'
import { projects } from './projectData'

export const dashboardData: DashboardData = {
  kpis: [
    { label: 'Active projects', value: String(projects.length), detail: `Across ${new Set(projects.map(project => project.state)).size} states`, trend: '+8.4% this quarter', tone: 'blue' },
    { label: 'Projects at risk', value: String(projects.filter(project => ['HIGH', 'CRITICAL'].includes(project.riskCategory)).length), detail: 'High or critical risk category', trend: '−3 from last month', tone: 'amber' },
    { label: 'Critical projects', value: String(projects.filter(project => project.riskCategory === 'CRITICAL').length).padStart(2, '0'), detail: 'Require immediate intervention', trend: '+1 this week', tone: 'red' },
    { label: 'Predicted delay', value: '8.7 months', detail: 'Average expected delay', trend: '12 projects assessed', tone: 'violet' },
  ],
  progress: [
    { label: 'Notification & award', value: 78, count: '4 projects', color: '#3478b8' },
    { label: 'Compensation', value: 61, count: '3 projects', color: '#4d9a7d' },
    { label: 'Possession & handover', value: 44, count: '3 projects', color: '#c28a3b' },
  ],
  riskDistribution: [
    { label: 'LOW', value: projects.filter(project => project.riskCategory === 'LOW').length, color: '#4d9a7d' },
    { label: 'MODERATE', value: projects.filter(project => project.riskCategory === 'MODERATE').length, color: '#c28a3b' },
    { label: 'HIGH', value: projects.filter(project => project.riskCategory === 'HIGH').length, color: '#c2614a' },
    { label: 'CRITICAL', value: projects.filter(project => project.riskCategory === 'CRITICAL').length, color: '#9c3f52' },
  ],
  projects: [
    ...projects.slice(0, 4),
  ],
  activities: [
    { title: 'Risk threshold crossed', description: 'LA-2024-087 moved to Critical after a legal status update.', time: '18 minutes ago', kind: 'alert' },
    { title: 'Portfolio review completed', description: 'Quarterly review for Rajasthan cluster was recorded.', time: '2 hours ago', kind: 'review' },
    { title: 'Compensation milestone updated', description: '42 parcels marked disbursed in North Koel Irrigation Project.', time: '5 hours ago', kind: 'update' },
  ],
}
