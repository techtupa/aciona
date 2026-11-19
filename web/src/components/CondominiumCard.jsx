
import './CondominiumCard.css'

function CondominiumCard({ name }) {
  return (
    <div className="condominium-card">
      <span className="condominium-card__label">
        Condomínio
      </span>

      <strong className="condominium-card__name">
        {name}
      </strong>
    </div>
  )
}

export default CondominiumCard
