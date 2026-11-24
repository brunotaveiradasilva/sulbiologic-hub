import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  texto: string
  /** 0 a 100: mostra uma barra com a porcentagem embaixo do texto. Sem ele, só o spinner. */
  progresso?: number | null
}

/**
 * Cobre a tela inteira com um carregamento e trava o app enquanto estiver montado: o resto da página
 * fica `inert` (nem clique nem Tab chegam nos botões), pra ninguém mexer no meio de uma operação longa.
 * Vai direto no body, fora do #root, senão ficaria inerte junto.
 */
export function CarregandoTelaInteira({ texto, progresso }: Props) {
  useEffect(() => {
    const raiz = document.getElementById('root')
    if (!raiz) return
    raiz.inert = true
    return () => {
      raiz.inert = false
    }
  }, [])

  const temProgresso = progresso != null
  const pct = temProgresso ? Math.round(Math.min(100, Math.max(0, progresso))) : 0

  return createPortal(
    <div className="carregando-tela" role="alert" aria-busy="true">
      <span className="carregando-tela-spinner" aria-hidden="true" />
      {texto}
      {temProgresso ? (
        <div
          className="carregando-tela-progresso"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <span className="carregando-tela-trilha">
            <span className="carregando-tela-barra" style={{ width: `${pct}%` }} />
          </span>
          <span className="carregando-tela-pct">{pct}%</span>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
