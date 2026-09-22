import { Icon } from './Icon'

export function LoadingState({ label = 'Loading data' }: { label?: string }) {
  return <div className="state-box"><span className="spinner" aria-hidden="true" /><span>{label}…</span></div>
}

export function EmptyState({ title = 'No data available', message = 'There is no information to display yet.' }: { title?: string; message?: string }) {
  return <div className="state-box state-empty"><span className="state-icon"><Icon name="database" /></span><strong>{title}</strong><span>{message}</span></div>
}

export function ErrorState({ message = 'Something went wrong while loading this view.' }: { message?: string }) {
  return <div className="state-box state-error"><span className="state-icon"><Icon name="alert" /></span><strong>Unable to load view</strong><span>{message}</span></div>
}
