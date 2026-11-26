
import './PageHeader.css'
import Brand from './Brand'

function PageHeader({
    userRole = 'Morador',
    onLogout,
}) {
    return (
        <header className="page-header">
            <Brand />

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
