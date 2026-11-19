import { useEffect, useState } from 'react'
import { aoServidorDemorar } from '../lib/api'

/**
 * Aviso no rodapé quando alguma leitura passa de alguns segundos sem resposta. Quase sempre é o
 * Render Free acordando (dorme depois de 15 min parado e leva ~1 min pra voltar); some sozinho
 * quando a resposta chega, ou quando a busca desiste e a tela mostra o "Tentar de novo".
 */
export function AvisoServidorAcordando() {
  const [demorando, setDemorando] = useState(false)

  useEffect(() => {
    aoServidorDemorar(setDemorando)
    return () => aoServidorDemorar(null)
  }, [])

  if (!demorando) return null

  return (
    <div className="aviso-acordando" role="status">
      <span className="aviso-acordando-spinner" aria-hidden="true" />
      <span>
        <strong>O servidor está acordando.</strong> Depois de um tempo parado ele leva até 1 minuto pra responder.
      </span>
    </div>
  )
}
