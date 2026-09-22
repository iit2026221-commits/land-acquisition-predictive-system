import { describe, expect, it } from 'vitest'
import { generateRecommendations } from './index'
import type { Project, RiskAssessment } from '../types'

const project = {
  id: 'P-1', name: 'Test', state: 'S', district: 'D', latitude: 1, longitude: 1, projectType: 'Road',
  landArea: 10, affectedFamilies: 20, acquisitionStage: 'Compensation', riskCategory: 'HIGH', riskScore: 70,
  delayProbability: 0.7, expectedDelay: '4 months', compensationProgress: 20, possessionProgress: 5,
  lastUpdated: '2026-01-01T00:00:00.000Z', dataCompleteness: 70,
} satisfies Project

const risk = {
  projectId: 'P-1', engineVersion: 'Risk Engine v1.0', assessedAt: '2026-01-01T00:00:00.000Z',
  sourceUpdatedAt: project.lastUpdated, overallScore: 70, overallLevel: 'HIGH', confidence: 'MEDIUM',
  dimensions: [{ key: 'legal', label: 'Legal risk', score: 80, level: 'CRITICAL', confidence: 'HIGH', contributingFactors: ['Two cases recorded.'], affectedFields: ['legalDisputes'], availableData: ['legal fields'], missingData: [], explanation: 'Legal issues require action.' }],
  topDrivers: ['Legal risk (80/100)'], missingData: [], explanation: 'Legal risk is elevated.',
} satisfies RiskAssessment

describe('decision-support recommendation engine', () => {
  it('prioritizes stage-aware risks and includes audit evidence', () => {
    const result = generateRecommendations({ project, riskAssessment: risk, now: '2026-01-02T00:00:00.000Z' })
    const legal = result.recommendations.find((item) => item.category === 'LEGAL')
    expect(legal?.priority).toBe('CRITICAL')
    expect(legal?.evidence).toContain('Two cases recorded.')
    expect(legal?.audit.ruleId).toBe('risk-dimension-legal')
  })

  it('emits a data-quality recommendation for stale sources', () => {
    const result = generateRecommendations({ project, riskAssessment: risk, now: '2026-03-01T00:00:00.000Z', staleAfterDays: 30 })
    expect(result.stale).toBe(true)
    expect(result.recommendations.some((item) => item.category === 'DATA_QUALITY')).toBe(true)
    expect(result.recommendations.every((item) => item.stale)).toBe(true)
  })

  it('orders dependencies before dependent recommendations', () => {
    const result = generateRecommendations({ project, riskAssessment: risk, now: '2026-01-02T00:00:00.000Z' })
    const quality = result.recommendations.find((item) => item.category === 'DATA_QUALITY')
    const legal = result.recommendations.find((item) => item.category === 'LEGAL')
    expect(quality).toBeDefined()
    expect(legal).toBeDefined()
    expect(legal?.dependencyIds).toContain(quality?.id)
    expect(result.recommendations.indexOf(quality!)).toBeLessThan(result.recommendations.indexOf(legal!))
  })
})
