import type { PredictionExplanation, Project, RiskAssessment, RiskDimension } from '../types'
import type {
  Recommendation,
  RecommendationCategory,
  RecommendationInput,
  RecommendationPriority,
  RecommendationResult,
  RecommendationSource,
} from './types'

export * from './types'

export const RECOMMENDATION_ENGINE_VERSION = 'Decision Support Engine v1.0'

const categoryForDimension: Record<string, RecommendationCategory> = {
  legal: 'LEGAL',
  compensation: 'COMPENSATION',
  documentation: 'DOCUMENTATION',
  approvals: 'APPROVALS',
  rehabilitation: 'REHABILITATION',
  possession: 'POSSESSION',
  timeline: 'TIMELINE',
  administrative: 'ADMINISTRATIVE',
}

const stageWeight: Record<string, Partial<Record<RecommendationCategory, number>>> = {
  notification: { DOCUMENTATION: 1.15, LEGAL: 1.1, APPROVALS: 1.1 },
  documentation: { DOCUMENTATION: 1.2, LEGAL: 1.1, APPROVALS: 1.1 },
  award: { COMPENSATION: 1.2, LEGAL: 1.1 },
  compensation: { COMPENSATION: 1.2, REHABILITATION: 1.1, LEGAL: 1.1 },
  rehabilitation: { REHABILITATION: 1.2, POSSESSION: 1.1 },
  possession: { POSSESSION: 1.2, TIMELINE: 1.1 },
}

const priorityFor = (score: number): RecommendationPriority =>
  score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW'

const actionForDimension: Record<string, { title: string; objective: string; area: string }> = {
  legal: { title: 'Prioritize legal review of unresolved acquisition disputes', objective: 'Reduce the legal bottleneck through documented case review.', area: 'Legal / claims cell' },
  compensation: { title: 'Prioritize resolution of pending compensation cases', objective: 'Improve progress toward compensation completion.', area: 'Compensation cell' },
  documentation: { title: 'Complete and verify missing acquisition documentation', objective: 'Create a reliable documentary basis for the next acquisition decision.', area: 'Land records cell' },
  approvals: { title: 'Escalate pending approvals through the responsible channel', objective: 'Unblock approvals required for the current acquisition stage.', area: 'Project authority' },
  rehabilitation: { title: 'Review pending rehabilitation and resettlement cases', objective: 'Improve delivery of rehabilitation and resettlement commitments.', area: 'R&R cell' },
  possession: { title: 'Resolve remaining possession and handover blockers', objective: 'Improve readiness for lawful possession and handover.', area: 'Project delivery team' },
  timeline: { title: 'Review the project timeline bottleneck', objective: 'Validate the critical path and reduce avoidable schedule exposure.', area: 'Project delivery team' },
  administrative: { title: 'Coordinate the outstanding administrative actions', objective: 'Improve cross-functional readiness for the current acquisition stage.', area: 'Project authority' },
}

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const validDate = (value: string | undefined): number | undefined => {
  if (!value || Number.isNaN(Date.parse(value))) return undefined
  return Date.parse(value)
}

const isStale = (value: string | undefined, now: number, staleAfterDays: number) => {
  const timestamp = validDate(value)
  return timestamp === undefined || now - timestamp > staleAfterDays * 86_400_000
}

function evidenceFor(dimension: RiskDimension): string[] {
  return [
    ...dimension.contributingFactors,
    ...dimension.availableData.map((item) => `Available data: ${item}.`),
    ...dimension.missingData.map((item) => `Missing data: ${item}.`),
  ]
}

function makeRecommendation(
  project: Project,
  dimension: RiskDimension,
  now: string,
  stale: boolean,
): Recommendation {
  const category = categoryForDimension[dimension.key]
  const stage = project.acquisitionStage || 'Unspecified'
  const stageKey = stage.toLowerCase()
  const score = Math.round((dimension.score ?? 20) * (stageWeight[stageKey]?.[category] ?? 1))
  const source: RecommendationSource[] = ['risk-assessment']
  const action = actionForDimension[dimension.key] ?? { title: `Address ${dimension.label.toLowerCase()}`, objective: `Reduce ${dimension.label.toLowerCase()} and unblock the ${stage} stage.`, area: 'Project delivery team' }
  const urgency = score >= 75 ? 'IMMEDIATE' : score >= 50 ? 'NEAR_TERM' : 'ROUTINE'
  return {
    id: `${project.id.toLowerCase()}-${dimension.key}`,
    category,
    affectedDimension: dimension.key,
    priority: priorityFor(score),
    priorityScore: Math.min(100, score),
    urgency,
    stage,
    title: action.title,
    trigger: `${dimension.label} is ${dimension.level} (${dimension.score ?? 'unscored'}/100).`,
    evidence: evidenceFor(dimension),
    rationale: dimension.explanation,
    responsibleArea: action.area,
    timeframe: score >= 75 ? 'Immediate (0–7 days)' : score >= 50 ? 'Near term (8–30 days)' : 'Next review cycle (31–60 days)',
    expectedObjective: action.objective,
    status: 'SUGGESTED',
    dependencyIds: [],
    source,
    stale,
    audit: {
      engineVersion: RECOMMENDATION_ENGINE_VERSION,
      generatedAt: now,
      inputSourceTimestamps: { project: project.lastUpdated, riskAssessment: undefined },
      sourceIds: [project.id, dimension.key],
      ruleId: `risk-dimension-${dimension.key}`,
    },
  }
}

function dataQualityRecommendation(project: Project, risk: RiskAssessment | undefined, now: string, stale: boolean): Recommendation | undefined {
  const missing = [...(risk?.missingData ?? [])]
  if (project.dataCompleteness !== undefined && project.dataCompleteness < 80) missing.push(`data completeness is ${project.dataCompleteness}%`)
  if (!missing.length && !stale) return undefined
  const score = stale ? 70 : 55
  return {
    id: `${project.id.toLowerCase()}-data-quality`,
    category: 'DATA_QUALITY',
    affectedDimension: 'data-quality',
    priority: priorityFor(score),
    priorityScore: score,
    urgency: stale ? 'IMMEDIATE' : 'NEAR_TERM',
    stage: project.acquisitionStage || 'Unspecified',
    title: 'Refresh and complete decision data',
    trigger: stale ? 'A source assessment or prediction is stale or undated.' : 'Required decision-support fields are incomplete.',
    evidence: missing.map((item) => `Data quality gap: ${item}.`).concat(stale ? ['One or more source records are stale or undated.'] : []),
    rationale: 'Recommendations should not rely on incomplete or stale inputs; refresh source records before making a material decision.',
    responsibleArea: 'Project monitoring / data steward',
    timeframe: 'Immediate (0–7 days)',
    expectedObjective: 'Restore a current, auditable evidence base for risk and prediction decisions.',
    status: 'SUGGESTED',
    dependencyIds: [],
    source: ['project', ...(risk ? ['risk-assessment' as const] : [])],
    stale,
    audit: { engineVersion: RECOMMENDATION_ENGINE_VERSION, generatedAt: now, inputSourceTimestamps: { project: project.lastUpdated, riskAssessment: risk?.assessedAt }, sourceIds: [project.id], ruleId: 'data-quality-refresh' },
  }
}

function orderRecommendations(items: Recommendation[]): Recommendation[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered: Recommendation[] = []
  const visiting = new Set<string>()
  const visit = (item: Recommendation) => {
    if (ordered.includes(item) || visiting.has(item.id)) return
    visiting.add(item.id)
    item.dependencyIds.forEach((id) => { const dependency = byId.get(id); if (dependency) visit(dependency) })
    visiting.delete(item.id)
    ordered.push(item)
  }
  items.sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id)).forEach(visit)
  return ordered
}

export function generateRecommendations(input: RecommendationInput): RecommendationResult {
  const now = input.now ?? new Date().toISOString()
  const nowMs = validDate(now) ?? Date.now()
  const staleAfterDays = input.staleAfterDays ?? 30
  const risk = input.riskAssessment
  const predictionExplanation: PredictionExplanation | undefined = input.predictionExplanation ?? input.prediction?.explanation
  const sourceStale = (risk ? isStale(risk.assessedAt, nowMs, staleAfterDays) : false)
    || (input.prediction ? isStale(input.prediction.generatedAt, nowMs, staleAfterDays) : false)
  const recommendations = risk?.dimensions
    .filter((dimension) => dimension.level !== 'LOW' && dimension.level !== 'INSUFFICIENT_DATA')
    .map((dimension) => makeRecommendation(input.project, dimension, now, sourceStale)) ?? []
  const quality = dataQualityRecommendation(input.project, risk, now, sourceStale)
  if (quality) {
    recommendations.push(quality)
    recommendations.forEach((recommendation) => {
      if (recommendation.id !== quality.id) recommendation.dependencyIds.push(quality.id)
    })
  }
  if (predictionExplanation?.topDrivers?.length && input.prediction?.predictionStatus === 'READY') {
    const prediction = makePredictionRecommendation(input.project, input.prediction.predictedRiskLevel, input.prediction.delayProbability, predictionExplanation, now, sourceStale)
    recommendations.push(prediction)
  }
  return { projectId: input.project.id, generatedAt: now, engineVersion: RECOMMENDATION_ENGINE_VERSION, stale: sourceStale, recommendations: orderRecommendations(recommendations) }
}

function makePredictionRecommendation(project: Project, level: string, probability: number, explanation: PredictionExplanation, now: string, stale: boolean): Recommendation {
  const score = Math.round(Math.max(probability * 100, level === 'CRITICAL' ? 85 : level === 'HIGH' ? 65 : 35))
  return {
    id: `${project.id.toLowerCase()}-prediction-delay`,
    category: 'TIMELINE',
    affectedDimension: 'predicted-delay',
    priority: priorityFor(score),
    priorityScore: Math.min(100, score),
    urgency: score >= 75 ? 'IMMEDIATE' : 'NEAR_TERM',
    stage: project.acquisitionStage || 'Unspecified',
    title: 'Mitigate predicted acquisition delay',
    trigger: `${Math.round(probability * 100)}% predicted probability of significant delay.`,
    evidence: [explanation.summary, ...explanation.topDrivers.map((driver) => `${driver.label}: ${driver.impact}.`)],
    rationale: `The prediction indicates a ${Math.round(probability * 100)}% delay probability; drivers are shown for transparent review, not as a guaranteed outcome.`,
    responsibleArea: 'Project delivery team',
    timeframe: score >= 75 ? 'Immediate (0–7 days)' : 'Near term (8–30 days)',
    expectedObjective: 'Reduce predicted delay exposure and validate the highest-impact drivers.',
    status: 'SUGGESTED',
    dependencyIds: [],
    source: ['prediction', 'prediction-explanation'],
    stale,
    audit: { engineVersion: RECOMMENDATION_ENGINE_VERSION, generatedAt: now, inputSourceTimestamps: { project: project.lastUpdated, prediction: undefined }, sourceIds: [project.id, explanation.explanationVersion], ruleId: 'prediction-delay-mitigation' },
  }
}
