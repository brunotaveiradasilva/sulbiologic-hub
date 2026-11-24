import type { Meta } from '../../types'

interface Props {
  meta: Meta
  /** Meta que aparece logo acima/abaixo nessa tela, ou null na primeira/última linha. */
  anterior: Meta | null
  proxima: Meta | null
  aoTrocar: (meta: Meta, vizinha: Meta) => void
}

/** Setas ↑/↓ pra mudar a ordem das metas — a mesma ordem vale pra todas as telas de metas. */
export function BotoesOrdemMeta({ meta, anterior, proxima, aoTrocar }: Props) {
  return (
    <>
      <button
        className="btn btn-sm btn-ghost"
        disabled={!anterior}
        aria-label={`Subir ${meta.nome}`}
        title="Subir"
        onClick={() => anterior && aoTrocar(meta, anterior)}
      >
        ↑
      </button>
      <button
        className="btn btn-sm btn-ghost"
        disabled={!proxima}
        aria-label={`Descer ${meta.nome}`}
        title="Descer"
        onClick={() => proxima && aoTrocar(meta, proxima)}
      >
        ↓
      </button>
    </>
  )
}
