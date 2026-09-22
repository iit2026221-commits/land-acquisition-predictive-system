import { Icon } from '../ui/Icon'
import { useEffect, useState } from 'react'
import { searchProjects } from '../../services/projectService'
import type { Project } from '../../types'
import { getAuthSession } from '../../services/authService'

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

    searchProjects(query).then(setResults)
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
              aria-label="Search projects, districts…"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search projects, districts…"
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
                    {project.id} · {project.district}, {project.state}
                  </small>
                </button>
              ))}
            </div>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <div className="search-results">
              <span>No projects found</span>
            </div>
          )}
        </div>

        <button
          className="icon-button"
          aria-label="Toggle theme"
          onClick={onTheme}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <Icon name="bell" />
          <span />
        </button>

        <div className="system-status">
          <span className="pulse" />
          Systems operational
        </div>

        {!session ? (
          <button
            className="profile sign-in-button"
            onClick={() => onNavigate('/login')}
            aria-label="Sign in as administrator"
          >
            <span className="avatar">AD</span>

            <span className="profile-text">
              <strong>Administrator</strong>
              <small>Sign in to run predictions</small>
            </span>

            <Icon name="chevron" size={14} />
          </button>
        ) : (
          <button
            className="profile"
            onClick={() => onNavigate('/settings')}
            aria-label="Open profile settings"
          >
            <span className="avatar">
              {session.role.slice(0, 2).toUpperCase()}
            </span>

            <span className="profile-text">
              <strong>
                {session.role.replaceAll('_', ' ')}
              </strong>

              <small>{session.email}</small>
            </span>

            <Icon name="chevron" size={14} />
          </button>
        )}
      </div>
    </header>
  )
}