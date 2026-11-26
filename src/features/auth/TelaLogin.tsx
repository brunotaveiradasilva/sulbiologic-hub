import { useState, type FormEvent } from 'react'
import { MODO_DEMO } from '../../api/api'
import { Logo } from '../../shared/components/Logo'

interface Props {
  entrando: boolean
  erro: string | null
  aoEntrar: (usuario: string, senha: string) => void
}

/** Porta de entrada do app: nada do almoxarifado carrega sem passar por aqui. */
export function TelaLogin({ entrando, erro, aoEntrar }: Props) {
  const [usuario, setUsuario] = useState(MODO_DEMO ? 'admin' : '')
  const [senha, setSenha] = useState(MODO_DEMO ? 'demo' : '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!usuario.trim() || !senha || entrando) return
    aoEntrar(usuario.trim(), senha)
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-brand">
          <Logo size={21} />
          <div>
            <h1>Entrar no Hub</h1>
            <span className="sub">Use seu usuário e senha.</span>
          </div>
        </div>

        {MODO_DEMO ? (
          <p className="msg login-demo">
            <strong>Demonstração.</strong> Dados fictícios, sem servidor: é só clicar em Entrar. Nada do que você mudar
            é salvo.
          </p>
        ) : null}

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
