
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import Brand from '../components/Brand'
import './Login.css'
import { UserRound, Building2 } from 'lucide-react'
import heroImage from '../assets/hero.png'


function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()

    if (!profile) {
      alert('Selecione um perfil para continuar.')
      return
    }

    if (profile === 'morador') {
      navigate('/ocorrencias/nova')
      return
    }

    if (profile === 'sindico') {
      navigate('/ocorrencias/fila')
    }
  }

  return (
    <main className="login-page">
      <header className="login-header">
        <Brand />
      </header>
      <section className="login-panel">
        <div className="login-form-container">
          <h2>Entre no Aciona</h2>
          <p className="login-subtitle">
            Acesse sua conta para continuar.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              id="email"
              name="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <Input
              id="password"
              name="password"
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <Button type="submit">
              Entrar
            </Button>
          </form>

          <div className="login-demo">
            <p className="login-demo-title">Contas de demonstração</p>

            <div className="login-demo-options">
              <button
                type="button"
                className={`login-demo-card ${profile === 'morador' ? 'is-selected' : ''}`}
                aria-pressed={profile === 'morador'}
                onClick={() => setProfile('morador')}
              >
                <div className="login-demo-card-heading">
                  <UserRound size={16} aria-hidden="true" />
                  <strong>Morador</strong>
                </div>
                <span>Acessar como morador</span>
              </button>

              <button
                type="button"
                className={`login-demo-card ${profile === 'sindico' ? 'is-selected' : ''}`}
                aria-pressed={profile === 'sindico'}
                onClick={() => setProfile('sindico')}
              >
                <div className="login-demo-card-heading">
                  <Building2 size={16} aria-hidden="true" />
                  <strong>Síndico</strong>
                </div>
                <span>Acessar como síndico</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="login-visual">
        <img
          src={heroImage}
          alt=""
          className="login-hero"
        />

        <div className="login-visual-text">
          <h1>Tudo começa com um relato.</h1>
        </div>
      </aside>
    </main>
  )
}

export default Login
