import { projects as demoProjects } from '../data/projectData'
import type { Project, ProjectDraft } from '../types'
import { getAuthSession } from './authService'
import { normalizeLocation } from './locationService'

const PROJECTS_KEY = 'lai-project-records'
const DRAFT_KEY = 'lai-project-draft'
const DRAFT_SAVED_AT_KEY = 'lai-project-draft-saved-at'
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

function mapBackendProject(value: Record<string, unknown>): Project {
  return {
    id: String(value.id),
    name: String(value.name ?? ''),
    state: String(value.state ?? ''),
    stateId: value.state_id ? String(value.state_id) : undefined,
    district: String(value.district ?? ''),
    districtId: value.district_id ? String(value.district_id) : undefined,
    latitude: Number(value.latitude ?? 0),
    longitude: Number(value.longitude ?? 0),
    projectType: String(value.project_type ?? ''),
    landArea: Number(value.land_area ?? 0),
    affectedFamilies: Number(value.affected_families ?? 0),
    acquisitionStage: String(value.acquisition_stage ?? ''),
    riskCategory: 'LOW',
    riskScore: 0,
    delayProbability: 0,
    expectedDelay: 'Not assessed',
    compensationProgress: 0,
    possessionProgress: 0,
    lastUpdated: String(value.created_at ?? new Date().toISOString()),
    description: value.description ? String(value.description) : undefined,
    monitoringStatus: value.status === 'archived' ? 'ARCHIVED' : 'ACTIVE',
    isDemo: Boolean(value.is_demo),
  }
}

async function getBackendProjects(): Promise<Project[] | null> {
  const session = getAuthSession()
  if (!session) return null
  const response = await fetch(`${baseUrl}/projects`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
  if (!response.ok) return null
  const body = await response.json() as Record<string, unknown>[]
  return body.map(mapBackendProject)
}

function readStoredProjects(): Project[] {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY)
    return stored ? JSON.parse(stored) as Project[] : []
  } catch {
    return []
  }
}

function readAllProjects(): Project[] {
  return [...demoProjects, ...readStoredProjects()].map(project => {
    const location = normalizeLocation(project.state, project.district)
    return { ...project, stateId: project.stateId ?? location.stateId, districtId: project.districtId ?? location.districtId }
  })
}

export async function getProjects(): Promise<Project[]> {
  const backendProjects = await getBackendProjects()
  if (backendProjects) return backendProjects.filter(project => project.monitoringStatus !== 'ARCHIVED')
  return Promise.resolve(readAllProjects().filter(project => project.monitoringStatus !== 'ARCHIVED'))
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const session = getAuthSession()
  if (session && /^\d+$/.test(id)) {
    const response = await fetch(`${baseUrl}/projects/${id}`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
    if (response.ok) return mapBackendProject(await response.json() as Record<string, unknown>)
  }
  return readAllProjects().find(project => project.id === id)
}

export function getProjectDraft(): ProjectDraft | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY)
    return stored ? JSON.parse(stored) as ProjectDraft : null
  } catch {
    return null
  }
}

export function getDraftSavedAt(): string | null {
  return localStorage.getItem(DRAFT_SAVED_AT_KEY)
}

export function saveProjectDraft(draft: ProjectDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  localStorage.setItem(DRAFT_SAVED_AT_KEY, new Date().toISOString())
}

export function clearProjectDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
  localStorage.removeItem(DRAFT_SAVED_AT_KEY)
}

export async function saveProject(project: Project): Promise<Project> {
  let savedProject = project
  const session = getAuthSession()
  if (session) {
    const response = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({
        name: project.name, description: project.description, latitude: project.latitude, longitude: project.longitude,
        state: project.state, state_id: project.stateId, district: project.district, district_id: project.districtId,
        project_type: project.projectType, land_area: project.landArea, affected_families: project.affectedFamilies,
        acquisition_stage: project.acquisitionStage, is_demo: project.isDemo ?? true,
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.detail?.message ?? 'Project could not be stored by the backend.')
    }
    const backendProject = mapBackendProject(await response.json() as Record<string, unknown>)
    savedProject = { ...project, id: backendProject.id }
  }
  const existing = readStoredProjects().filter(item => item.id !== savedProject.id && item.id !== project.id)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([...existing, savedProject]))
  clearProjectDraft()
  return Promise.resolve(savedProject)
}

export async function updateProject(id: string, project: Project): Promise<Project> {
  return saveProject({ ...project, id, lastUpdated: new Date().toISOString() })
}

export async function archiveProject(id: string): Promise<void> {
  const project = await getProjectById(id)
  if (project) await saveProject({ ...project, monitoringStatus: 'ARCHIVED', lastUpdated: new Date().toISOString() })
}

export async function searchProjects(query: string): Promise<Project[]> {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return getProjects()
  return (await getProjects()).filter(project => `${project.id} ${project.name} ${project.state} ${project.district}`.toLowerCase().includes(normalized))
}
