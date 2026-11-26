
import './PageHeader.css'
import logoAciona from '../assets/logo-aciona.webp'

function PageHeader({
    userRole = 'Morador',
    onLogout,
}) {
    return (
        <header className="page-header">
            <div className="page-header__brand">
                <img
                    src={logoAciona}
                    alt="Logo Aciona"
                    className="page-header__logo"
                />

                <h1>Aciona</h1>
            </div>

            <div className="page-header__user">
                <span>{userRole}</span>

                <button
                    type="button"
                    onClick={onLogout}
                >
                    Sair
                </button>
            </div>
        </header>
    )
}

export default PageHeader
