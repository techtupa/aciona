import './CondominiumSelector.css'

function CondominiumSelector({
    condominiums,
    selectedCondominiumId,
    onChange,
}) {
    return (
        <div className="condominium-selector">
            <label htmlFor="condominium-select">
                Condomínio ativo
            </label>

            <select
                id="condominium-select"
                value={selectedCondominiumId}
                onChange={(event) => onChange(event.target.value)}
            >
                {condominiums.map((condominium) => (
                    <option
                        key={condominium.id}
                        value={condominium.id}
                    >
                        {condominium.name}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default CondominiumSelector
