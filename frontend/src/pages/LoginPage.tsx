import { useState } from 'react'
import type { FormEvent } from 'react'
import { setAuthSession } from '../services/authService'

export function LoginPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [username, setUsername] = useState('analyst')
  const [password, setPassword] = useState('analyst123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail?.message ?? 'Sign in failed.')
      setAuthSession({ ...body.user, accessToken: body.access_token })
      onNavigate('/dashboard')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Sign in failed.') } finally { setLoading(false) }
  }
  return <div className="page"><div className="page-heading"><div><p className="eyebrow">Secure session</p><h1>Sign in to LandIQ</h1><p className="page-subtitle">Role and project access are enforced by the backend authorization service.</p></div></div><form className="form-card login-card" onSubmit={submit}><label>Username<input type="text" value={username} onChange={event => setUsername(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error && <p className="error-text">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button><p className="muted">Development accounts are seeded for local demonstration only.</p></form></div>
}
