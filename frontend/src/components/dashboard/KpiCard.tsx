import { Icon } from '../ui/Icon'

export function KpiCard({ label, value, detail, trend, tone }: { label: string; value: string; detail: string; trend: string; tone: string }) {
  return <article className={`kpi-card kpi-${tone}`}><div className="kpi-top"><span>{label}</span><span className="kpi-icon"><Icon name={tone === 'red' ? 'alert' : tone === 'violet' ? 'trend' : 'grid'} size={17} /></span></div><strong className="kpi-value">{value}</strong><span className="kpi-detail">{detail}</span><div className="kpi-trend"><Icon name="trend" size={13} />{trend}</div></article>
}
