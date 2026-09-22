import type { ProjectDraft } from '../types'
import { getDistrictByName, getStateByName } from '../data/locations'

export type ValidationResult = { errors: Record<string, string>; warnings: string[] }

export function validateProject(draft: ProjectDraft, final = false): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: string[] = []
  if (!draft.name.trim()) errors.name = 'Project name is required.'
  const state = getStateByName(draft.state)
  if (!state) errors.state = 'Select a state from the canonical location list.'
  if (!draft.district.trim()) errors.district = 'Select a district.'
  else if (state && !getDistrictByName(state.id, draft.district)) errors.district = 'Select a district belonging to the selected state.'
  if (!draft.projectType) errors.projectType = 'Select a project type.'
  if (!draft.totalLandRequired || draft.totalLandRequired <= 0) errors.totalLandRequired = 'Enter total land required in hectares.'
  if ((draft.landAcquired ?? 0) > (draft.totalLandRequired ?? 0)) errors.landAcquired = 'Land acquired cannot exceed total land required.'
  if ((draft.compensationDisbursed ?? 0) > (draft.compensationApproved ?? 0)) errors.compensationDisbursed = 'Disbursed amount cannot exceed approved compensation.'
  if ((draft.familiesCompensated ?? 0) > (draft.eligibleFamilies ?? 0)) errors.familiesCompensated = 'Compensated families cannot exceed eligible families.'
  if (draft.plannedStart && draft.plannedCompletion && draft.plannedCompletion < draft.plannedStart) errors.plannedCompletion = 'Planned completion cannot precede project start.'
  if ((draft.possessionPercentage ?? 0) > (((draft.landAcquired ?? 0) / Math.max(draft.totalLandRequired ?? 0, 1)) * 100)) warnings.push('Possession progress is ahead of acquisition completion; please verify the figures.')
  if ((draft.legalDisputes ?? 0) > 0 && !draft.legalStatus?.trim()) warnings.push('Add a legal status update for the active disputes.')
  if (final && !draft.responsibleDepartment) errors.responsibleDepartment = 'Responsible department is required before final save.'
  return { errors, warnings }
}

export function calculateCompleteness(draft: ProjectDraft): number {
  const fields: (keyof ProjectDraft)[] = ['name', 'state', 'district', 'projectType', 'description', 'totalLandRequired', 'affectedFamilies', 'responsibleDepartment', 'documentationStatus', 'compensationStatus', 'legalStatus', 'rrPlanStatus', 'possessionStatus', 'plannedStart', 'plannedCompletion', 'currentBottleneck']
  return Math.round(fields.filter(field => draft[field] !== '' && draft[field] !== undefined && draft[field] !== null).length / fields.length * 100)
}
