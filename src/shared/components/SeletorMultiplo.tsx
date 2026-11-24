import { useEffect, useRef, useState } from 'react'

interface Props {
  id: string
  rotulo: string
  opcoes: { valor: string; rotulo: string }[]
  /** Vazio = todos. */
  selecionados: string[]
  aoMudar: (selecionados: string[]) => void
  /** "Todos os representantes" */
  textoTodos: string
  /** "representantes" — pro resumo "3 representantes". */
  nomePlural: string
}

/**
 * Filtro que deixa marcar vários itens com checkbox, no lugar de um select de um item só. Nenhum
 * marcado vale "todos". Abre uma lista embaixo do botão; fecha clicando fora ou no Esc.
 */
export function SeletorMultiplo({ id, rotulo, opcoes, selecionados, aoMudar, textoTodos, nomePlural }: Props) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false)
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  const marcados = new Set(selecionados)
  const resumo =
    selecionados.length === 0
      ? textoTodos
      : selecionados.length === 1
        ? (opcoes.find((o) => o.valor === selecionados[0])?.rotulo ?? `1 ${nomePlural}`)
        : `${selecionados.length} ${nomePlural}`

  function alternar(valor: string) {
    aoMudar(marcados.has(valor) ? selecionados.filter((v) => v !== valor) : [...selecionados, valor])
  }

  return (
    <div className="field consulta-filtro seletor-multiplo" ref={containerRef}>
      <label htmlFor={id}>{rotulo}</label>
      <button
        id={id}
        type="button"
        className="seletor-multiplo-botao"
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        <span>{resumo}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto ? (
        <div className="seletor-multiplo-lista" role="group" aria-label={rotulo}>
          <label className="seletor-multiplo-opcao seletor-multiplo-todos">
            <input type="checkbox" checked={selecionados.length === 0} onChange={() => aoMudar([])} />
            {textoTodos}
          </label>
          {opcoes.map((o) => (
            <label key={o.valor} className="seletor-multiplo-opcao">
              <input type="checkbox" checked={marcados.has(o.valor)} onChange={() => alternar(o.valor)} />
              {o.rotulo}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
