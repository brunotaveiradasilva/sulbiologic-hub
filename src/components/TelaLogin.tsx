import { useState, type FormEvent } from 'react'

interface Props {
  entrando: boolean
  erro: string | null
  aoEntrar: (usuario: string, senha: string) => void
}

/** Porta de entrada do app: nada do almoxarifado carrega sem passar por aqui. */
export function TelaLogin({ entrando, erro, aoEntrar }: Props) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!usuario.trim() || !senha || entrando) return
    aoEntrar(usuario.trim(), senha)
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-brand">
          <h1>SulBiologic Hub</h1>
          <span className="sub">entre para continuar</span>
        </div>

        <div className="field">
          <label htmlFor="l-usuario">Usuário</label>
          <input
            id="l-usuario"
            autoFocus
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="l-senha">Senha</label>
          <input
            id="l-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro ? <p className="msg login-erro">{erro}</p> : null}

        <button className="btn btn-primary login-submit" type="submit" disabled={entrando}>
          {entrando ? (
            <>
              <span className="login-spinner" aria-hidden="true" />
              Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>
    </div>
  )
}
