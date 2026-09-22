import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({ children, path, onNavigate, dark, onTheme, sidebarOpen, setSidebarOpen }: { children: ReactNode; path: string; onNavigate: (path: string) => void; dark: boolean; onTheme: () => void; sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  return <div className="app-shell"><Sidebar currentPath={path} onNavigate={onNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />{sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" /> }<div className="shell-main"><Header onMenu={() => setSidebarOpen(true)} dark={dark} onTheme={onTheme} onNavigate={onNavigate} /><main className="main-content">{children}</main><footer className="statusbar"><span><span className="pulse" />Demo data environment</span><span>Last synchronized: 07 Sep 2026, 21:40 IST</span><span>Data source: demonstration layer</span></footer></div></div>
}
