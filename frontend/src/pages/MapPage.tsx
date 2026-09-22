import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getProjects } from '../services/projectService'
import { getRiskAssessment } from '../services/riskService'
import type { Project, RiskLevel } from '../types'
import { Card } from '../components/ui/Card'
import { RiskBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { Icon } from '../components/ui/Icon'

const INDIA_CENTER: [number, number] = [22.8, 79.2]
const riskColors: Record<RiskLevel, string> = { LOW: '#4d9a7d', MODERATE: '#c28a3b', HIGH: '#c2614a', CRITICAL: '#9c3f52' }
const stages = ['All stages', 'Notification', 'Documentation', 'Award', 'Compensation', 'Possession', 'Rehabilitation']

function FitProjects({ projects }: { projects: Project[] }) {
  const map = useMap()
  useEffect(() => {
    if (projects.length > 1) {
      const bounds: LatLngBoundsExpression = projects.map(project => [project.latitude, project.longitude])
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 6 })
    } else if (projects.length === 1) {
      map.setView([projects[0].latitude, projects[0].longitude], 7)
    }
  }, [map, projects])
  return null
}

function ProjectPanel({ project, onView }: { project: Project; onView: () => void }) {
  const assessment = getRiskAssessment(project)
  return <aside className="map-project-panel" aria-label={`Selected project: ${project.name}`}><div className="panel-heading"><div><p className="eyebrow">Selected project</p><h2>{project.name}</h2><p>{project.id} · {project.district}, {project.state}</p></div><RiskBadge level={assessment.overallLevel} /></div><div className="project-metrics"><div><span>Risk assessment</span><strong>{assessment.overallScore ?? '—'}<small>/100</small></strong></div><div><span>Assessment confidence</span><strong>{assessment.confidence}</strong></div><div><span>Acquisition stage</span><strong>{project.acquisitionStage}</strong></div><div><span>Acquisition stage</span><strong>{project.acquisitionStage}</strong></div><div><span>Land area</span><strong>{project.landArea.toLocaleString()} ha</strong></div><div><span>Affected families</span><strong>{project.affectedFamilies.toLocaleString()}</strong></div></div><div className="panel-progress"><div><span>Compensation</span><strong>{project.compensationProgress}%</strong></div><div className="mini-track"><span style={{ width: `${project.compensationProgress}%` }} /></div><div><span>Possession</span><strong>{project.possessionProgress}%</strong></div><div className="mini-track"><span style={{ width: `${project.possessionProgress}%` }} /></div></div><div className="panel-status"><span>Legal status</span><strong>{project.legalStatus}</strong></div><button className="primary-button panel-action" onClick={onView}>View project <Icon name="arrow" size={15} /></button></aside>
}

export function MapPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [allProjects, setAllProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)
  const [search, setSearch] = useState('')
  const [state, setState] = useState('All states')
  const [district, setDistrict] = useState('All districts')
  const [risk, setRisk] = useState('All risk categories')
  const [stage, setStage] = useState('All stages')
  const [projectType, setProjectType] = useState('All project types')

  useEffect(() => { getProjects().then(setAllProjects).catch(() => setError(true)) }, [])
  const states = useMemo(() => ['All states', ...new Set((allProjects ?? []).map(project => project.state).sort())], [allProjects])
  const districts = useMemo(() => ['All districts', ...new Set((allProjects ?? []).filter(project => state === 'All states' || project.state === state).map(project => project.district).sort())], [allProjects, state])
  const types = useMemo(() => ['All project types', ...new Set((allProjects ?? []).map(project => project.projectType).sort())], [allProjects])
  const filtered = useMemo(() => (allProjects ?? []).filter(project => {
    const query = search.toLowerCase()
    return (!query || `${project.name} ${project.id} ${project.state} ${project.district}`.toLowerCase().includes(query)) &&
      (state === 'All states' || project.state === state) &&
      (district === 'All districts' || project.district === district) &&
      (risk === 'All risk categories' || getRiskAssessment(project).overallLevel === risk) &&
      (stage === 'All stages' || project.acquisitionStage === stage) &&
      (projectType === 'All project types' || project.projectType === projectType)
  }), [allProjects, search, state, district, risk, stage, projectType])
  const reset = () => { setSearch(''); setState('All states'); setDistrict('All districts'); setRisk('All risk categories'); setStage('All stages'); setProjectType('All project types') }
  const highRiskCount = filtered.filter(project => ['HIGH', 'CRITICAL'].includes(getRiskAssessment(project).overallLevel)).length
  const criticalCount = filtered.filter(project => getRiskAssessment(project).overallLevel === 'CRITICAL').length
  const boundsProjects = filtered.length ? filtered : (allProjects ?? [])

  return <div className="page map-page"><div className="page-heading"><div><div className="title-line"><p className="eyebrow">Monitoring · Geographic intelligence</p><span className="demo-label">FICTIONAL DEMO DATA</span></div><h1>Interactive land intelligence</h1><p className="page-subtitle">Monitor the geographic concentration of land acquisition projects and emerging risk signals across India.</p></div><button className="secondary-button" onClick={reset}><Icon name="map" size={15} /> India view</button></div>
    <Card className="map-toolbar"><label className="map-search"><Icon name="search" size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search projects, states or districts…" aria-label="Search projects, states or districts" /></label><select aria-label="Filter by state" value={state} onChange={event => { setState(event.target.value); setDistrict('All districts') }}>{states.map(option => <option key={option}>{option}</option>)}</select><select aria-label="Filter by district" value={district} onChange={event => setDistrict(event.target.value)}>{districts.map(option => <option key={option}>{option}</option>)}</select><select aria-label="Filter by risk category" value={risk} onChange={event => setRisk(event.target.value)}><option>All risk categories</option>{(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(option => <option key={option}>{option}</option>)}</select><select aria-label="Filter by acquisition stage" value={stage} onChange={event => setStage(event.target.value)}>{stages.map(option => <option key={option}>{option}</option>)}</select><select aria-label="Filter by project type" value={projectType} onChange={event => setProjectType(event.target.value)}>{types.map(option => <option key={option}>{option}</option>)}</select><button className="reset-button" onClick={reset}>Reset filters</button></Card>
    {error ? <ErrorState message="The demonstration project service could not be initialized." /> : !allProjects ? <LoadingState label="Loading geographic project data" /> : <><div className="map-summary">{[['Visible projects', filtered.length], ['High risk', highRiskCount], ['Critical', criticalCount], ['States covered', new Set(filtered.map(project => project.state)).size], ['Intervention signals', highRiskCount]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="map-workspace"><Card className="map-card"><div className="map-card-header"><div><p className="eyebrow">National view · {filtered.length} visible</p><h2>Project risk landscape</h2></div><div className="map-mode"><span className="active">Projects</span><span title="Risk density layer reserved for a later phase">Risk density <small>Later phase</small></span></div></div>{filtered.length === 0 ? <EmptyState title="No projects match these filters" message="Try broadening the state, district, risk or stage selection." /> : <div className="leaflet-wrap"><MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="leaflet-map" aria-label="Interactive map of fictional land acquisition projects across India"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitProjects projects={boundsProjects} />{filtered.map(project =>     <CircleMarker key={project.id} center={[project.latitude, project.longitude]} radius={project.id === selected?.id ? 11 : 8} pathOptions={{ color: '#fff', weight: 2, fillColor: riskColors[getRiskAssessment(project).overallLevel as RiskLevel] ?? '#7d909d', fillOpacity: .95 }} eventHandlers={{ click: () => setSelected(project) }}><Tooltip direction="top" offset={[0, -8]}>{project.name} · {getRiskAssessment(project).overallLevel}</Tooltip><Popup><strong>{project.name}</strong><br />{project.district}, {project.state}<br /><span>Risk assessment {getRiskAssessment(project).overallScore ?? 'insufficient data'} / 100</span></Popup></CircleMarker>)}</MapContainer><div className="map-legend"><strong>Risk category</strong>{(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(level => <span key={level}><i style={{ background: riskColors[level] }} />{level}</span>)}<small>Markers are fictional demonstration locations.</small></div><div className="map-help">Click a marker to inspect project intelligence</div></div>}</Card>{selected && <ProjectPanel project={selected} onView={() => onNavigate(`/projects/${selected.id}`)} />}</div></>}
  </div>
}
