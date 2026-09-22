import { useEffect, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Dashboard, PlaceholderPage } from './pages/Dashboard'
import { MapPage } from './pages/MapPage'
import { ProjectRegistrationPage } from './pages/ProjectRegistrationPage'
import { ProjectPortfolioPage } from './pages/ProjectPortfolioPage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
import { getProjectById } from './services/projectService'
import type { ProjectDraft } from './types'
import { RiskPage } from './pages/RiskPage'
import { LoginPage } from './pages/LoginPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

const titles: Record<string, string> = {
  '/projects': 'Land projects',
  '/map': 'Interactive map',
  '/stages': 'Acquisition stages',
  '/analytics': 'Predictive analytics',
  '/risk': 'Risk overview',
  '/recommendations': 'Recommendations',
  '/interventions': 'Intervention center',
  '/alerts': 'Alerts & escalations',
  '/data-management': 'Data management',
  '/users': 'Users & roles',
  '/audit': 'Audit logs',
  '/settings': 'System settings',
}

function getPath() { return window.location.pathname === '/' ? '/dashboard' : window.location.pathname }

export default function App() {
  const [path, setPath] = useState(getPath)
  const [dark, setDark] = useState(() => localStorage.getItem('lai-theme') === 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('lai-theme', dark ? 'dark' : 'light') }, [dark])
  const navigate = (next: string) => { window.history.pushState({}, '', next); setPath(next); setSidebarOpen(false) }
  useEffect(() => { const onPop = () => setPath(getPath()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  const projectId = path.startsWith('/projects/') ? path.split('/')[2] : undefined
  const editingId = path.endsWith('/edit') ? path.split('/')[2] : undefined
  const content = path === '/login' ? <LoginPage onNavigate={navigate} /> : path === '/analytics' ? <AnalyticsPage onNavigate={navigate} /> : path === '/dashboard' ? <Dashboard onNavigate={navigate} /> : path === '/map' ? <MapPage onNavigate={navigate} /> : path === '/risk' ? <RiskPage onNavigate={navigate} /> : path === '/projects' ? <ProjectPortfolioPage onNavigate={navigate} /> : path === '/projects/new' ? <ProjectRegistrationPage onNavigate={navigate} /> : editingId ? <ProjectEditorRoute id={editingId} onNavigate={navigate} /> : projectId ? <ProjectDetailsPage id={projectId} onNavigate={navigate} /> : titles[path] ? <PlaceholderPage title={titles[path]} /> : <NotFound />
  return <AppShell path={path} onNavigate={navigate} dark={dark} onTheme={() => setDark(value => !value)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>{content}</AppShell>
}

function ProjectEditorRoute({ id, onNavigate }: { id: string; onNavigate: (path: string) => void }) {
  const [project, setProject] = useState<ProjectDraft | undefined>()
  useEffect(() => { getProjectById(id).then(value => setProject(value as ProjectDraft | undefined)) }, [id])
  return project ? <ProjectRegistrationPage initialProject={project} onNavigate={onNavigate} /> : <PlaceholderPage title="Loading project editor" />
}

function NotFound() {
  return <div className="page"><div className="page-heading"><div><p className="eyebrow">404 · Navigation boundary</p><h1>Page not found</h1><p className="page-subtitle">The requested workspace does not exist in this application.</p></div></div><PlaceholderPage title="Return to the dashboard" /></div>
}
