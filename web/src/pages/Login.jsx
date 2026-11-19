
function Login() {
  function handleSubmit(event) {
    event.preventDefault()

    // A autenticação com o Supabase será integrada posteriormente.
  }

  return (
    <main>
      <section>
        <h1>Aciona</h1>
        <p>Entre na sua conta para continuar.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
