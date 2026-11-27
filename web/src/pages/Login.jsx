
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import Brand from '../components/Brand'
import { supabase } from '../lib/supabase'
import { buscarMeusCondominios } from '../services/api'
import hero from '../assets/hero.png'
import './Login.css'
import { UserRound, Building2, Eye, EyeOff } from 'lucide-react'

const CONTAS = {
  morador: { nome: 'Morador', email: 'morador.vista@teste.local' },
  sindico: { nome: 'Síndico', email: 'sindico.vista@teste.local' },
}

function Login() {
  const navigate = useNavigate()
  const campoSenha = useRef(null)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [errosCampos, setErrosCampos] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [contaEscolhida, setContaEscolhida] = useState(null)
  const [aviso, setAviso] = useState('')

  // Preenche só o e-mail: a senha é sempre digitada por quem entra.
  function escolherConta(perfil) {
    setEmail(CONTAS[perfil].email)
    setErrosCampos({ email: '', senha: '' })
    setErro('')
    setContaEscolhida(perfil)
    setAviso(`E-mail de ${CONTAS[perfil].nome} preenchido. Digite a senha e use o botão Entrar.`)
    campoSenha.current.focus()
  }

  // Encerra a sessão e mostra o motivo, para ninguém ficar logado sem condomínio.
  async function falhar(mensagem) {
    await supabase.auth.signOut({ scope: 'local' })
    setEntrando(false)
    setErro(mensagem)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (entrando) return
    setErro('')

    const emailValido = event.currentTarget.elements.email.validity.valid && email.trim() !== ''
    const novosErros = {
      email: emailValido ? '' : 'Informe um e-mail válido.',
      senha: senha ? '' : 'Informe a senha.',
    }
    setErrosCampos(novosErros)
    if (novosErros.email || novosErros.senha) {
      event.currentTarget.elements[novosErros.email ? 'email' : 'senha'].focus()
      return
    }

    setEntrando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      setEntrando(false)
      setErro(
        error.status === 400
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar agora. Tente de novo em instantes.',
      )
      return
    }

    const resposta = await buscarMeusCondominios(data.session.access_token)
    const condominios = resposta.dados?.condominios
    if (!resposta.ok || !Array.isArray(condominios)) {
      await falhar('Não foi possível carregar seus condomínios. Tente de novo.')
      return
    }
    if (condominios.length === 0) {
      await falhar('Sua conta ainda não está ligada a nenhum condomínio. Fale com o síndico.')
      return
    }

    // O papel decide a primeira tela, e o condomínio vai na URL para a página saber qual abrir,
    // mesmo depois de recarregar. O síndico começa pelo primeiro condomínio que administra.
    const doSindico = condominios.find((c) => c.papel === 'sindico')
    const inicial = doSindico ?? condominios[0]
    const destino = doSindico ? '/ocorrencias/fila' : '/ocorrencias/nova'
    navigate(`${destino}?condominio=${inicial.id}`)
  }

  return (
    <main className="login-page">
      <header className="login-header">
        <Brand />
      </header>
      <section className="login-panel">
        <div className="login-form-container">
          <h1>Entre no Aciona</h1>
          <p className="login-subtitle">
            Acesse sua conta para continuar.
          </p>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <Input
              id="email"
              name="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrosCampos((atuais) => ({ ...atuais, email: '' }))
              }}
              autoComplete="email"
              required
              error={errosCampos.email}
            />

            <Input
              id="senha"
              name="senha"
              label="Senha"
              type={senhaVisivel ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => {
                setSenha(event.target.value)
                setErrosCampos((atuais) => ({ ...atuais, senha: '' }))
              }}
              autoComplete="current-password"
              required
              error={errosCampos.senha}
              ref={campoSenha}
              adornment={
                <button
                  type="button"
                  aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setSenhaVisivel((visivel) => !visivel)}
                >
                  {senhaVisivel ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              }
            />

            {erro && <p className="login-error" role="alert">{erro}</p>}

            <Button type="submit" disabled={entrando}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <div className="login-demo">
            <p className="login-demo-title">Contas de demonstração</p>

            <div className="login-demo-options">
              <button
                type="button"
                className={`login-demo-card ${contaEscolhida === 'morador' ? 'is-selected' : ''}`}
                aria-pressed={contaEscolhida === 'morador'}
                onClick={() => escolherConta('morador')}
              >
                <div className="login-demo-card-heading">
                  <UserRound size={16} aria-hidden="true" />
                  <strong>{CONTAS.morador.nome}</strong>
                </div>
                <span>{CONTAS.morador.email}</span>
              </button>

              <button
                type="button"
                className={`login-demo-card ${contaEscolhida === 'sindico' ? 'is-selected' : ''}`}
                aria-pressed={contaEscolhida === 'sindico'}
                onClick={() => escolherConta('sindico')}
              >
                <div className="login-demo-card-heading">
                  <Building2 size={16} aria-hidden="true" />
                  <strong>{CONTAS.sindico.nome}</strong>
                </div>
                <span>{CONTAS.sindico.email}</span>
              </button>
            </div>

            <p className="login-demo-notice" role="status">{aviso}</p>
          </div>
        </div>
      </section>

      <aside className="login-visual">
        <img
          src={hero}
          alt=""
          className="login-hero"
        />

        <div className="login-visual-text">
          <p>Tudo começa<br />com um relato.</p>
        </div>
      </aside>
    </main>
  )
}

export default Login
