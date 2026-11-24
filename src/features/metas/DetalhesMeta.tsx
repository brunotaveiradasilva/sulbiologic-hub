import { rotuloPeriodoMeta } from './periodoMeta'
import type { Meta } from '../../types'

/** Período (etiqueta "Dias 1 a 19") e descrição embaixo do nome da meta; nada se ela não tiver nenhum dos dois. */
export function DetalhesMeta({ meta }: { meta: Meta }) {
  const periodo = rotuloPeriodoMeta(meta)
  return (
    <>
      {periodo ? <span className="meta-periodo">{periodo}</span> : null}
      {meta.descricao ? <span className="meta-detalhe">{meta.descricao}</span> : null}
    </>
  )
}
