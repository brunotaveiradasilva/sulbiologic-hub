import { useEffect, useLayoutEffect, useState } from 'react'
import type { AbaPrincipal } from './MenuLateral'

const TITULOS: Record<AbaPrincipal, string> = {
  inicio: 'Início',
  materiais: 'Materiais',
  metas: 'Metas',
  campanhas: 'Campanhas',
  dados: 'Dados',
  cadastros: 'Cadastros',
  conta: 'Minha conta',
}

/** A partir de quanto rolado o título grande da tela já saiu de vista e o pequeno entra na barra. */
const LIMITE_ROLAGEM = 44

/**
 * Barra do topo, só no celular, no jeito dos apps: parada no topo, vazia enquanto o título grande
 * da tela está à vista; quando ele sai rolando, o título reaparece pequeno aqui, com uma linha embaixo.
 * Trocar de seção volta a tela pro começo, como num app.
 */
export function BarraTopo({ aba }: { aba: AbaPrincipal }) {
  const [rolado, setRolado] = useState(false)

  useEffect(() => {
    function aoRolar() {
      setRolado(window.scrollY > LIMITE_ROLAGEM)
    }
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  // Antes de pintar, pra não piscar a tela nova ainda rolada.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [aba])

  return (
    <header className={`barra-topo so-celular${rolado ? ' is-rolado' : ''}`} aria-hidden="true">
      <span className="barra-topo-titulo">{TITULOS[aba]}</span>
    </header>
  )
}
