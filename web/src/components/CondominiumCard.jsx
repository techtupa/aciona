
import './CondominiumCard.css'

function CondominiumCard({ name }) {
  return (
    <div className="condominium-card">
      <svg
        width="21"
        height="20"
        viewBox="0 0 21 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0.824951 18.5333H19.575M2.90828 18.5333V6.03328H7.07495M7.07495 18.5333V0.824951H17.4916V18.5333M11.2416 4.99162H13.325M11.2416 9.15829H13.325M11.2416 13.325H13.325"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#07575A"
        />
      </svg>

      <strong className="condominium-card__name">
        Condomínio {name}
      </strong>
    </div>
  )
}

export default CondominiumCard
