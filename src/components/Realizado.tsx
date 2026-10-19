import { useState } from 'react'
import { DialogoPositivacao } from './DialogoPositivacao'
import type { Meta, MetaRepresentante } from '../types'

interface Props {
  meta: Meta
  atribuicao: MetaRepresentante | null
  /** O realizado já formatado. */
  texto: string
}

/**
 * Valor realizado na tabela de metas. Em meta de positivação (CLIENTES) com atribuição vira um botão
 * que abre quem foram os clientes e quanto cada um comprou por semana.
 */
export function Realizado({ meta, atribuicao, texto }: Props) {
  const [aberto, setAberto] = useState(false)
  if (meta.unidade !== 'CLIENTES' || !atribuicao) return <>{texto}</>
  return (
    <>
      <button type="button" className="btn-realizado" title="Ver os clientes por semana" onClick={() => setAberto(true)}>
        {texto}
      </button>
      {aberto ? <DialogoPositivacao atribuicao={atribuicao} aoFechar={() => setAberto(false)} /> : null}
    </>
  )
}
