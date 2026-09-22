import type { PredictionResult, Project, PredictionExplanation } from '../types'
import { getAuthSession, can } from './authService'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

function mapPrediction(value: Record<string, unknown>): PredictionResult {
  return {
    projectId: String(value.project_id),
    modelVersion: String(value.model_version),
    delayProbability: Number(value.delay_probability),
    predictedDelayMonths: Number(value.predicted_delay_months),
    predictedRiskLevel: value.predicted_risk_level as PredictionResult['predictedRiskLevel'],
    generatedAt: String(value.generated_at),
    predictionStatus: value.prediction_status as PredictionResult['predictionStatus'],
    dataQuality: String(value.data_quality),
    message: value.message ? String(value.message) : undefined,
    explanation: value.explanation as PredictionExplanation | undefined,
  }
}

export async function requestPrediction(project: Project): Promise<PredictionResult> {
  const session = getAuthSession()

  if (!session) {
    throw new Error('Administrator sign-in is required to run a prediction.')
  }

  if (!can('prediction:create', session)) {
    throw new Error('Administrator permission is required to run a prediction.')
  }

  const response = await fetch(
    `${baseUrl}/predictions/project/${encodeURIComponent(project.id)}/run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        ...project,
        projectId: project.id,
      }),
      signal: AbortSignal.timeout(9000),
    },
  )

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail =
      typeof body.detail === 'object' && body.detail?.message
        ? body.detail.message
        : typeof body.detail === 'string'
          ? body.detail
          : 'The ML prediction service is unavailable.'

    throw new Error(
      `${detail}${body.requestId ? ` (Request ID: ${body.requestId})` : ''}`,
    )
  }

  return mapPrediction(body)
}