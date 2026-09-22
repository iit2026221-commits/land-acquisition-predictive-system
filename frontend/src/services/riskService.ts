import { assessProject, evaluateProject, RISK_ENGINE_VERSION } from '../riskEngine'
import type { Project, RiskAssessment } from '../types'

export function getRiskAssessment(project: Project): RiskAssessment {
  return assessProject(project)
}

export function getAssessments(projects: Project[]): RiskAssessment[] {
  return projects.map(project => getRiskAssessment(project))
}

export function isAssessmentStale(assessment: RiskAssessment, project: Project): boolean {
  return assessment.sourceUpdatedAt !== project.lastUpdated
}

export { evaluateProject, RISK_ENGINE_VERSION }
