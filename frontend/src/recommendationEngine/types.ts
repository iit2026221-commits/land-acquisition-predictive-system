import type { PredictionExplanation, PredictionResult, Project, RiskAssessment } from '../types'

export type RecommendationCategory =
  | 'DATA_QUALITY'
  | 'LEGAL'
  | 'COMPENSATION'
  | 'DOCUMENTATION'
  | 'APPROVALS'
  | 'REHABILITATION'
  | 'POSSESSION'
  | 'TIMELINE'
  | 'ADMINISTRATIVE'
  | 'MONITORING'

export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type RecommendationSource = 'risk-assessment' | 'prediction' | 'prediction-explanation' | 'project'

export type RecommendationAuditMetadata = {
  engineVersion: string
  generatedAt: string
  inputSourceTimestamps: Record<string, string | undefined>
  sourceIds: string[]
  ruleId: string
}

export type Recommendation = {
  id: string
  category: RecommendationCategory
  affectedDimension: string
  priority: RecommendationPriority
  priorityScore: number
  urgency: 'IMMEDIATE' | 'NEAR_TERM' | 'ROUTINE'
  stage: string
  title: string
  trigger: string
  evidence: string[]
  rationale: string
  responsibleArea: string
  timeframe: string
  expectedObjective: string
  status: 'SUGGESTED'
  dependencyIds: string[]
  source: RecommendationSource[]
  stale: boolean
  audit: RecommendationAuditMetadata
}

export type RecommendationInput = {
  project: Project
  riskAssessment?: RiskAssessment
  prediction?: PredictionResult
  predictionExplanation?: PredictionExplanation
  now?: string
  staleAfterDays?: number
}

export type RecommendationResult = {
  projectId: string
  generatedAt: string
  engineVersion: string
  stale: boolean
  recommendations: Recommendation[]
}
