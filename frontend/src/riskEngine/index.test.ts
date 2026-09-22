import { describe, expect, it } from 'vitest'
import { evaluateProject } from './index'
import type { Project } from '../types'

const base = { id: 'TEST', name: 'Test', state: 'State', district: 'District', latitude: 1, longitude: 1, projectType: 'Road', landArea: 10, affectedFamilies: 10, acquisitionStage: 'Award', riskCategory: 'LOW' as const, riskScore: 0, delayProbability: 0, expectedDelay: 'Not assessed', compensationProgress: 80, legalStatus: 'No disputes', possessionProgress: 60, lastUpdated: 'fixed' } satisfies Project

describe('risk engine', () => {
  it('is deterministic for identical input', () => expect(evaluateProject(base)).toEqual(evaluateProject(base)))
  it('does not treat missing legal data as low risk', () => expect(evaluateProject({ ...base, legalStatus: undefined, legalDisputes: undefined, disputeSeverity: undefined }).dimensions.find(item => item.key === 'legal')?.level).toBe('INSUFFICIENT_DATA'))
  it('raises legal assessment for severe recorded disputes', () => expect(evaluateProject({ ...base, legalDisputes: 4, courtCases: 2, disputeSeverity: 'CRITICAL' }).dimensions.find(item => item.key === 'legal')?.level).toBe('CRITICAL'))
})
