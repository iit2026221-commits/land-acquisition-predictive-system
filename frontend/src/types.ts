export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type AssessmentLevel = RiskLevel | 'INSUFFICIENT_DATA'
export type AssessmentConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA'

export type Project = {
  id: string
  name: string
  state: string
  stateId?: string
  district: string
  districtId?: string
  latitude: number
  longitude: number
  projectType: string
  landArea: number
  affectedFamilies: number
  acquisitionStage: string
  riskCategory: RiskLevel
  riskScore: number
  delayProbability: number
  expectedDelay: string
  compensationProgress: number
  legalStatus?: string
  possessionProgress: number
  lastUpdated: string
  description?: string
  implementingDepartment?: string
  projectAuthority?: string
  priorityLevel?: string
  totalLandRequired?: number
  landAcquired?: number
  governmentLand?: number
  privateLand?: number
  forestLand?: number
  affectedPersons?: number
  landowners?: number
  tenants?: number
  documentationStatus?: string
  landRecordsVerified?: string
  ownershipVerification?: string
  surveyStatus?: string
  notificationStatus?: string
  approvalStatus?: string
  pendingApprovals?: number
  pendingDocuments?: number
  responsibleDepartment?: string
  compensationStatus?: string
  compensationApproved?: number
  compensationDisbursed?: number
  eligibleFamilies?: number
  familiesCompensated?: number
  pendingCompensationCases?: number
  legalDisputes?: number
  ownershipDisputes?: number
  courtCases?: number
  stayOrders?: number
  unresolvedClaims?: number
  disputeSeverity?: string
  affectedLandUnderDispute?: number
  rrFamilies?: number
  rrPlanStatus?: string
  rrFamiliesCovered?: number
  rrPendingCases?: number
  rehabilitationProgress?: number
  resettlementProgress?: number
  facilitiesStatus?: string
  possessionStatus?: string
  possessionPercentage?: number
  parcelsAcquired?: number
  parcelsRemaining?: number
  plannedStart?: string
  plannedCompletion?: string
  currentExpectedCompletion?: string
  administrativeActions?: string
  stakeholderResponsiveness?: string
  interDepartmentDependencies?: string
  currentBottleneck?: string
  dataCompleteness?: number
  monitoringStatus?: string
  isDemo?: boolean
}

export type ProjectDraft = Required<Project>

export type DashboardData = {
  kpis: { label: string; value: string; detail: string; trend: string; tone: 'blue' | 'amber' | 'red' | 'violet' }[]
  progress: { label: string; value: number; count: string; color: string }[]
  riskDistribution: { label: RiskLevel; value: number; color: string }[]
  projects: Project[]
  activities: { title: string; description: string; time: string; kind: 'alert' | 'update' | 'review' }[]
}

export type RiskDimensionKey = 'compensation' | 'legal' | 'documentation' | 'approvals' | 'rehabilitation' | 'possession' | 'timeline' | 'administrative'

export type RiskDimension = {
  key: RiskDimensionKey
  label: string
  score: number | null
  level: AssessmentLevel
  confidence: AssessmentConfidence
  contributingFactors: string[]
  affectedFields: string[]
  availableData: string[]
  missingData: string[]
  explanation: string
}

export type RiskAssessment = {
  projectId: string
  engineVersion: string
  assessedAt: string
  sourceUpdatedAt: string
  overallScore: number | null
  overallLevel: AssessmentLevel
  confidence: AssessmentConfidence
  dimensions: RiskDimension[]
  topDrivers: string[]
  missingData: string[]
  explanation: string
}

export type PredictionResult = {
  projectId: string
  modelVersion: string
  delayProbability: number
  predictedDelayMonths: number
  predictedRiskLevel: RiskLevel
  generatedAt: string
  predictionStatus: 'READY' | 'INSUFFICIENT_DATA' | 'PREDICTION_UNAVAILABLE'
  dataQuality: string
  message?: string
  explanation?: PredictionExplanation
}

export type PredictionExplanation = {
  explanationVersion: string
  summary: string
  topDrivers: PredictionDriver[]
  drivers: PredictionDriver[]
  metadata: { modelVersion?: string; featureVersion?: string; method: string }
}

export type PredictionDriver = {
  feature: string
  label: string
  value: string | number
  contribution: number
  direction: 'positive' | 'negative' | 'neutral'
  impact: string
}
