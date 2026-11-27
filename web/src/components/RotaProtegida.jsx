import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { lerToken } from '../lib/supabase'

// Só mostra a página para quem entrou. Sem sessão, leva para o login.
function RotaProtegida({ children }) {
  const [estado, setEstado] = useState('verificando')

  useEffect(() => {
    let ativo = true
    lerToken().then((token) => {
      if (ativo) setEstado(token ? 'liberado' : 'sem-login')
    })
    return () => {
      ativo = false
    }
  }, [])

  if (estado === 'verificando') return null
  if (estado === 'sem-login') return <Navigate to="/login" replace />
  return children
}

export default RotaProtegida
