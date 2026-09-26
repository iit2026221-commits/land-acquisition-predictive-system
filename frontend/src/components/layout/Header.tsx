import { Icon } from '../ui/Icon'
import { useEffect, useState } from 'react'
import { searchProjects } from '../../services/projectService'
import type { Project } from '../../types'
import {
  getAuthSession,
  clearAuthSession,
} from '../../services/authService'

export function Header({
  onMenu,
  dark,
  onTheme,
  onNavigate,
}: {
  onMenu: () => void
  dark: boolean
  onTheme: () => void
  onNavigate: (path: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Project[]>([])
  const session = getAuthSession()

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    searchProjects(query).then(setResults).catch(() => setResults([]))
  }, [query])

  return (
    <header className="topbar">
      <button
        className="menu-button"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Icon name="menu" />
      </button>

      <div className="breadcrumbs">
        <span>Overview</span>
        <Icon name="chevron" size={14} />
        <strong>Executive dashboard</strong>
      </div>

      <div className="header-actions">
        <div className="search-wrap">
          <label className="search">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search projects..."
            />
          </label>

          {results.length > 0 && (
            <div className="search-results">
              {results.slice(0, 5).map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    setQuery('')
                    onNavigate(`/projects/${project.id}`)
                  }}
                >
                  <strong>{project.name}</strong>
                  <small>
                    {project.district}, {project.state}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="icon-button"
          onClick={onTheme}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>

        {!session ? (
          <button
            className="profile sign-in-button"
            onClick={() => onNavigate('/login')}
          >
            <span className="avatar">AD</span>
            <span className="profile-text">
              <strong>Administrator</strong>
              <small>Sign in</small>
            </span>
          </button>
        ) : (
          <div
            className="profile"
            style={{ gap: '10px' }}
          >
            <span className="avatar">
              {session.role
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <span className="profile-text">
              <strong>
                {session.role.replaceAll('_', ' ')}
              </strong>
              <small>{session.email}</small>
            </span>

            <button
              className="icon-button"
              onClick={() => {
                clearAuthSession()
                onNavigate('/login')
                window.location.reload()
              }}
              title="Logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}