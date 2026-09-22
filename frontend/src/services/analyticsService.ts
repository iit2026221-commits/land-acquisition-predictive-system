import { getProjects } from './projectService'
import { getAssessments } from './riskService'
import { getActiveProjects } from './projectSelectors'
import type { Project, RiskAssessment, RiskLevel } from '../types'

export type AnalyticsSnapshot = {
  projects: Project[]
  assessments: RiskAssessment[]
  metrics: { total: number; active: number; highRisk: number; critical: number; avgDelayProbability: number; avgLandProgress: number; avgCompensation: number; avgRehabilitation: number; intervention: number }
  riskDistribution: { level: RiskLevel; count: number; percentage: number }[]
  domains: { label: string; count: number; average: number }[]
  states: { name: string; projects: number; highRisk: number; averageRisk: number; averageDelay: number; progress: number }[]
  quality: { complete: number; incomplete: number; average: number; stale: number }
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const projects = getActiveProjects(await getProjects())
  const assessments = getAssessments(projects)
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  const riskDistribution = (['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(level => {
    const count = projects.filter(project => project.riskCategory === level).length
    return { level, count, percentage: projects.length ? Math.round((count / projects.length) * 100) : 0 }
  })
  const domainMap = new Map<string, number[]>()
  assessments.flatMap(assessment => assessment.dimensions).forEach(dimension => {
    if (dimension.score !== null) domainMap.set(dimension.label, [...(domainMap.get(dimension.label) ?? []), dimension.score])
  })
  const states = [...new Set(projects.map(project => project.state))].map(name => {
    const inState = projects.filter(project => project.state === name)
    return { name, projects: inState.length, highRisk: inState.filter(project => project.riskCategory === 'HIGH' || project.riskCategory === 'CRITICAL').length, averageRisk: Math.round(average(inState.map(project => project.riskScore))), averageDelay: Math.round(average(inState.map(project => project.delayProbability))), progress: Math.round(average(inState.map(project => project.possessionProgress))) }
  }).sort((a, b) => b.averageRisk - a.averageRisk)
  return {
    projects, assessments,
    metrics: { total: projects.length, active: projects.length, highRisk: projects.filter(project => project.riskCategory === 'HIGH' || project.riskCategory === 'CRITICAL').length, critical: projects.filter(project => project.riskCategory === 'CRITICAL').length, avgDelayProbability: Math.round(average(projects.map(project => project.delayProbability))), avgLandProgress: Math.round(average(projects.map(project => project.possessionProgress))), avgCompensation: Math.round(average(projects.map(project => project.compensationProgress))), avgRehabilitation: Math.round(average(projects.map(project => project.rehabilitationProgress ?? 0))), intervention: projects.filter(project => project.riskCategory === 'HIGH' || project.riskCategory === 'CRITICAL').length },
    riskDistribution,
    domains: [...domainMap.entries()].map(([label, values]) => ({ label, count: values.filter(value => value >= 50).length, average: Math.round(average(values)) })).sort((a, b) => b.average - a.average),
    states,
    quality: { complete: projects.filter(project => (project.dataCompleteness ?? 0) >= 80).length, incomplete: projects.filter(project => (project.dataCompleteness ?? 0) < 80).length, average: Math.round(average(projects.map(project => project.dataCompleteness ?? 0))), stale: projects.filter(project => !project.lastUpdated || Number.isNaN(Date.parse(project.lastUpdated))).length },
  }
}
