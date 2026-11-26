
import './PageHeader.css'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Brand from './Brand'

function PageHeader({
    userRole = 'Morador',
}) {
    const navigate = useNavigate()

    // Encerra a sessão antes de voltar para o login.
    async function sair() {
        await supabase.auth.signOut({ scope: 'local' })
        navigate('/login')
    }

    return (
        <header className="page-header">
            <Brand />

            <div className="page-header__user">
                <span>{userRole}</span>

                <button
                    type="button"
                    onClick={sair}
                >
                    Sair
                </button>
            </div>
        </header>
    )
}

export default PageHeader
