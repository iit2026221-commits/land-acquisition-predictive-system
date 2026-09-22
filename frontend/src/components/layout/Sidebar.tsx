import { Icon } from '../ui/Icon'

type NavItem = { label: string; icon: Parameters<typeof Icon>[0]['name']; path?: string }
const groups: { label: string; items: NavItem[] }[] = [
  { label: 'Overview', items: [{ label: 'Executive dashboard', icon: 'grid', path: '/dashboard' }, { label: 'Risk overview', icon: 'shield', path: '/risk' }, { label: 'Project portfolio', icon: 'folder', path: '/projects' }] },
  { label: 'Monitoring', items: [{ label: 'Interactive map', icon: 'map', path: '/map' }] },
  { label: 'Analytics', items: [{ label: 'Predictive analytics', icon: 'chart', path: '/analytics' }] },
]

export function Sidebar({ currentPath, onNavigate, open, onClose }: { currentPath: string; onNavigate: (path: string) => void; open: boolean; onClose: () => void }) {
  const item = (nav: NavItem) => <button className={`nav-item ${nav.path === currentPath ? 'active' : ''}`} disabled={!nav.path} onClick={() => nav.path && onNavigate(nav.path)} title={!nav.path ? 'Available in a later phase' : undefined}><Icon name={nav.icon} /><span>{nav.label}</span>{!nav.path && <span className="nav-soon">Soon</span>}</button>
  return <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary navigation">
    <div className="brand"><div className="brand-mark">LA</div><div><strong>Land<span>IQ</span></strong><small>Acquisition intelligence</small></div><button className="mobile-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div>
    <nav className="nav-list">
      {groups.map(group => <div className="nav-group" key={group.label}><p className="nav-label">{group.label}</p>{group.items.map(nav => <div key={nav.label}>{item(nav)}</div>)}</div>)}
    </nav>
    <div className="sidebar-footer"><div className="demo-note"><span className="demo-dot" />Demo environment<strong>Fictional data only</strong></div><div className="version">Platform v0.1 · Part 1 foundation</div></div>
  </aside>
}
