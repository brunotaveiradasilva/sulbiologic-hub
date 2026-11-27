import { MODO_DEMO } from '../api/api'
import { useAuth } from '../features/auth/useAuth'
import { TelaLogin } from '../features/auth/TelaLogin'
import { PainelHub } from './PainelHub'
import { AvisoServidorAcordando } from '../features/auth/AvisoServidorAcordando'

/**
 * Porta de entrada do app: sem login, só a tela de login existe — o resto (e a busca de
 * dados na API) só monta depois que `usuario` vem preenchido.
 */
export default function App() {
  const auth = useAuth()

  if (!auth.usuario) {
    return (
      <>
        <TelaLogin entrando={auth.entrando} erro={auth.erro} aoEntrar={auth.entrar} />
        <AvisoServidorAcordando />
      </>
    )
  }

  return (
    <>
      <PainelHub
        usuario={auth.usuario}
        nomeExibido={auth.nomeExibido ?? auth.usuario}
        isAdmin={auth.isAdmin}
        consultaMetas={auth.consultaMetas}
        veAlmoxarifado={auth.veAlmoxarifado}
        avatar={auth.avatar}
        aoSair={auth.sair}
        aoTrocarFoto={auth.trocarFoto}
        aoSalvarDados={auth.atualizarMeusDados}
      />
      <AvisoServidorAcordando />
      {MODO_DEMO ? <div className="selo-demo">Demonstração · dados fictícios</div> : null}
    </>
  )
}
