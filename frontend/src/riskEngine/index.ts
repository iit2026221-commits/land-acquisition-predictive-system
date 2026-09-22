import type { AssessmentConfidence, AssessmentLevel, Project, RiskAssessment, RiskDimension, RiskDimensionKey } from '../types'

export const RISK_ENGINE_VERSION = 'Risk Engine v1.0'

const labels: Record<RiskDimensionKey, string> = {
  compensation: 'Compensation risk',
  legal: 'Legal risk',
  documentation: 'Documentation risk',
  approvals: 'Approval risk',
  rehabilitation: 'Rehabilitation & Resettlement risk',
  possession: 'Possession risk',
  timeline: 'Timeline risk',
  administrative: 'Stakeholder / administrative risk',
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const levelFor = (score: number): AssessmentLevel => score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW'
const confidenceFor = (available: number, missing: number): AssessmentConfidence => available === 0 ? 'INSUFFICIENT_DATA' : missing === 0 ? 'HIGH' : missing <= 1 ? 'MEDIUM' : 'LOW'
const percent = (value: number | undefined, fallback = 0) => clamp(value ?? fallback)

function dimension(key: RiskDimensionKey, score: number | null, factors: string[], affectedFields: string[], availableData: string[], missingData: string[], explanation: string): RiskDimension {
  const confidence = confidenceFor(availableData.length, missingData.length)
  return { key, label: labels[key], score: score === null ? null : clamp(score), level: score === null ? 'INSUFFICIENT_DATA' : levelFor(score), confidence, contributingFactors: factors, affectedFields, availableData, missingData, explanation }
}

export function evaluateProject(project: Project): Omit<RiskAssessment, 'assessedAt'> {
  const dimensions: RiskDimension[] = []
  const compensationAvailable = project.compensationApproved !== undefined || project.compensationDisbursed !== undefined || project.compensationStatus
  const compensationCompletion = compensationAvailable ? percent(project.compensationApproved ? (project.compensationDisbursed ?? 0) / project.compensationApproved * 100 : project.compensationProgress) : null
  dimensions.push(dimension('compensation', compensationCompletion === null ? null : 100 - compensationCompletion, compensationCompletion !== null && compensationCompletion < 70 ? [`Compensation completion is ${compensationCompletion}%.`] : [], ['compensationApproved', 'compensationDisbursed', 'compensationStatus'], compensationAvailable ? ['compensation status and progress'] : [], compensationAvailable ? [] : ['compensation status or amounts'], compensationCompletion === null ? 'Compensation information is insufficient for an assessment.' : `Compensation completion is ${compensationCompletion}%; lower completion increases this input-based indicator.`))

  const legalAvailable = project.legalDisputes !== undefined || project.disputeSeverity || project.legalStatus
  const legalSeverity = { NONE: 0, LOW: 25, MODERATE: 50, HIGH: 75, CRITICAL: 100 }[project.disputeSeverity ?? 'NONE'] ?? 0
  const legalCount = (project.legalDisputes ?? 0) + (project.ownershipDisputes ?? 0) + (project.courtCases ?? 0) + (project.stayOrders ?? 0) + (project.unresolvedClaims ?? 0)
  dimensions.push(dimension('legal', legalAvailable ? clamp(Math.max(legalSeverity, legalCount * 8)) : null, legalCount ? [`${legalCount} legal issue(s) recorded.`] : [], ['legalDisputes', 'disputeSeverity', 'legalStatus'], legalAvailable ? ['legal fields'] : [], legalAvailable ? [] : ['legal dispute status'], legalAvailable ? (legalCount ? 'Recorded legal issues contribute to this input-based indicator.' : 'No recorded legal issues were provided.') : 'Legal information is insufficient; this is not treated as low risk.'))

  const documentationValues = [project.documentationStatus, project.landRecordsVerified, project.ownershipVerification, project.surveyStatus].filter((value): value is string => Boolean(value))
  const documentationScore = documentationValues.length ? 100 - documentationValues.filter(value => value === 'COMPLETE').length / documentationValues.length * 100 : null
  dimensions.push(dimension('documentation', documentationScore, documentationScore !== null && documentationScore > 50 ? [`${Math.round(documentationScore)}% of recorded documentation indicators are incomplete.`] : [], ['documentationStatus', 'landRecordsVerified', 'ownershipVerification', 'surveyStatus'], documentationValues, documentationValues.length ? [] : ['documentation and verification status'], documentationScore === null ? 'Documentation information is insufficient for an assessment.' : 'Incomplete or pending documentation indicators may create downstream approval dependencies.'))

  const approvalsAvailable = project.pendingApprovals !== undefined || project.approvalStatus || project.administrativeActions
  const approvalsScore = approvalsAvailable ? clamp((project.pendingApprovals ?? 0) * 15 + (project.approvalStatus === 'BLOCKED' ? 45 : project.approvalStatus === 'IN PROGRESS' ? 20 : 0)) : null
  dimensions.push(dimension('approvals', approvalsScore, (project.pendingApprovals ?? 0) > 0 ? [`${project.pendingApprovals} approval(s) remain pending.`] : [], ['pendingApprovals', 'approvalStatus', 'administrativeActions'], approvalsAvailable ? ['approval fields'] : [], approvalsAvailable ? [] : ['approval status or pending approvals'], approvalsScore === null ? 'Approval information is insufficient for an assessment.' : 'Pending approval information is represented as an input-based indicator.'))

  const rrRelevant = (project.affectedFamilies ?? project.affectedPersons ?? 0) > 0
  const rrAvailable = project.rrPlanStatus || project.rehabilitationProgress !== undefined || project.resettlementProgress !== undefined
  const rrCompletion = rrAvailable ? ((project.rehabilitationProgress ?? 0) + (project.resettlementProgress ?? 0)) / 2 : null
  dimensions.push(dimension('rehabilitation', !rrRelevant ? 0 : rrCompletion === null ? null : 100 - rrCompletion, rrRelevant && rrCompletion !== null && rrCompletion < 60 ? [`R&R progress is ${Math.round(rrCompletion)}%.`] : [], ['rrPlanStatus', 'rehabilitationProgress', 'resettlementProgress'], rrRelevant && rrAvailable ? ['R&R fields'] : [], rrRelevant && !rrAvailable ? ['R&R plan or progress'] : [], !rrRelevant ? 'No affected families are recorded; R&R is not applicable based on available data.' : rrCompletion === null ? 'R&R information is insufficient for an assessment.' : 'R&R progress is treated as an input-based indicator.'))

  const acquisitionCompletion = project.totalLandRequired ? (project.landAcquired ?? 0) / project.totalLandRequired * 100 : project.landArea ? project.possessionProgress : null
  const possessionAvailable = project.possessionPercentage !== undefined || project.possessionProgress !== undefined || project.possessionStatus
  const possessionScore = possessionAvailable && acquisitionCompletion !== null ? clamp(Math.max(0, acquisitionCompletion - (project.possessionPercentage ?? project.possessionProgress)) * 2) : possessionAvailable ? clamp(100 - (project.possessionPercentage ?? project.possessionProgress)) : null
  dimensions.push(dimension('possession', possessionScore, possessionScore !== null && possessionScore > 30 ? [`Possession progress trails acquisition progress by an observable margin.`] : [], ['possessionPercentage', 'possessionStatus', 'landAcquired'], possessionAvailable ? ['possession fields'] : [], possessionAvailable ? [] : ['possession progress'], possessionScore === null ? 'Possession information is insufficient for an assessment.' : 'Possession and acquisition progress are compared as descriptive indicators.'))

  const timelineAvailable = project.plannedStart || project.plannedCompletion || project.currentExpectedCompletion
  const timelineScore = timelineAvailable && project.plannedCompletion && project.currentExpectedCompletion && project.currentExpectedCompletion > project.plannedCompletion ? 70 : timelineAvailable ? 20 : null
  dimensions.push(dimension('timeline', timelineScore, timelineScore === 70 ? ['Current expected completion is later than planned completion.'] : [], ['plannedStart', 'plannedCompletion', 'currentExpectedCompletion'], timelineAvailable ? ['timeline dates'] : [], timelineAvailable ? [] : ['planned timeline'], timelineScore === null ? 'Timeline information is insufficient for an assessment.' : 'Schedule comparison is descriptive and does not represent an ML delay prediction.'))

  const administrativeAvailable = project.stakeholderResponsiveness || project.interDepartmentDependencies || project.administrativeActions || project.currentBottleneck
  const administrativeScore = administrativeAvailable ? clamp((project.stakeholderResponsiveness === 'Slow' ? 55 : project.stakeholderResponsiveness === 'Mixed' ? 30 : 0) + (project.currentBottleneck ? 25 : 0) + (project.interDepartmentDependencies ? 15 : 0)) : null
  dimensions.push(dimension('administrative', administrativeScore, administrativeScore && administrativeScore > 0 ? ['Administrative coordination fields indicate open dependencies or bottlenecks.'] : [], ['stakeholderResponsiveness', 'interDepartmentDependencies', 'administrativeActions', 'currentBottleneck'], administrativeAvailable ? ['administrative fields'] : [], administrativeAvailable ? [] : ['stakeholder or administrative status'], administrativeScore === null ? 'Administrative information is insufficient for an assessment.' : 'Administrative fields are represented as transparent input indicators.'))

  const scored = dimensions.filter(item => item.score !== null)
  const overallScore = scored.length ? clamp(scored.reduce((sum, item) => sum + (item.score ?? 0), 0) / scored.length) : null
  const missingData = dimensions.flatMap(item => item.missingData)
  const sortedDrivers = [...scored].filter(item => (item.score ?? 0) > 0).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3).map(item => `${item.label} (${item.score}/100)`)
  const confidence = confidenceFor(scored.length, dimensions.filter(item => item.level === 'INSUFFICIENT_DATA').length)
  return { projectId: project.id, engineVersion: RISK_ENGINE_VERSION, sourceUpdatedAt: project.lastUpdated, overallScore, overallLevel: overallScore === null ? 'INSUFFICIENT_DATA' : levelFor(overallScore), confidence, dimensions, topDrivers: sortedDrivers, missingData, explanation: overallScore === null ? 'The project does not contain enough structured information for an overall assessment.' : sortedDrivers.length ? `The deterministic assessment is driven primarily by ${sortedDrivers.join(', ')}. This is an input-based risk assessment, not an ML prediction.` : 'No elevated input-based risk drivers were recorded. This is not an ML prediction.' }
}

export function assessProject(project: Project, assessedAt = new Date().toISOString()): RiskAssessment {
  return { ...evaluateProject(project), assessedAt }
}
