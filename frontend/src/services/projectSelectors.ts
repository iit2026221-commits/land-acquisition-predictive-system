import type { Project, RiskLevel } from '../types'

export function getActiveProjects(projects: Project[]) {
  return projects.filter(project => project.monitoringStatus !== 'ARCHIVED')
}

export function getProjectsByRisk(projects: Project[], risk: RiskLevel) {
  return getActiveProjects(projects).filter(project => project.riskCategory === risk)
}

export function getPortfolioStatistics(projects: Project[]) {
  const active = getActiveProjects(projects)
  const assessed = active.filter(project => project.expectedDelay !== 'Not assessed')
  return {
    active: active.length,
    atRisk: active.filter(project => project.riskCategory === 'HIGH' || project.riskCategory === 'CRITICAL').length,
    critical: active.filter(project => project.riskCategory === 'CRITICAL').length,
    states: new Set(active.map(project => project.state)).size,
    intervention: active.filter(project => project.riskCategory === 'HIGH' || project.riskCategory === 'CRITICAL').length,
    averageDelay: assessed.length ? assessed.reduce((sum, project) => sum + parseFloat(project.expectedDelay) || 0, 0) / assessed.length : 0,
  }
}
