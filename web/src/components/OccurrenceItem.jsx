
import StatusBadge from './StatusBadge'
import './OccurrenceItem.css'
import { MapPin } from 'lucide-react'

function OccurrenceItem({ occurrence }) {
    const statusLabels = {
        registered: 'Registrada',
        progress: 'Em andamento',
        resolved: 'Resolvida',
    }

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(occurrence.createdAt))

    return (
        <article className="occurrence-item">
            <div className="occurrence-item__content">
                <span className="occurrence-item__number">
                    {occurrence.number}
                </span>

                <h2 className="occurrence-item__summary">
                    {occurrence.summary}
                </h2>
                <div className="occurrence-item__location">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{occurrence.location}</span>
                </div>
            </div>

            <div className="occurrence-item__details">
                <StatusBadge status={occurrence.status}>
                    {statusLabels[occurrence.status]}
                </StatusBadge>

                <time dateTime={occurrence.createdAt}>
                    {formattedDate}
                </time>
            </div>
        </article>
    )
}

export default OccurrenceItem
