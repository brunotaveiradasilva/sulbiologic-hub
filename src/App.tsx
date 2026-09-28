import { useAuth } from './hooks/useAuth'
import { TelaLogin } from './components/TelaLogin'
import { PainelAlmoxarifado } from './components/PainelAlmoxarifado'

/**
 * Porta de entrada do app: sem login, só a tela de login existe — o resto (e a busca de
 * dados na API) só monta depois que `usuario` vem preenchido.
 */
export default function App() {
  const auth = useAuth()

  if (!auth.usuario) {
    return <TelaLogin entrando={auth.entrando} erro={auth.erro} aoEntrar={auth.entrar} />
  }

  return (
    <PainelAlmoxarifado
      usuario={auth.usuario}
      isAdmin={auth.isAdmin}
      consultaMetas={auth.consultaMetas}
      avatar={auth.avatar}
      aoSair={auth.sair}
      aoTrocarFoto={auth.trocarFoto}
    />
  )
}
