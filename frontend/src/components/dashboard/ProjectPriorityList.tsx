import type { Project } from '../../types'
import { Card } from '../ui/Card'
import { RiskBadge } from '../ui/Badge'

export function ProjectPriorityList({ projects }: { projects: Project[] }) {
  return <Card className="priority-card"><div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>Priority projects</h2></div><button className="text-button">View portfolio <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>Land acquisition project</th><th>Acquisition stage</th><th>Risk category</th><th>Expected delay</th><th>Last updated</th></tr></thead><tbody>{projects.map(project => <tr key={project.id}><td><div className="project-name"><strong>{project.name}</strong><small>{project.id} · {project.district}, {project.state}</small></div></td><td>{project.acquisitionStage}</td><td><RiskBadge level={project.riskCategory} /><small className="score">Risk score {project.riskScore}</small></td><td className="delay">{project.expectedDelay}</td><td className="muted">{project.lastUpdated}</td></tr>)}</tbody></table></div></Card>
}
