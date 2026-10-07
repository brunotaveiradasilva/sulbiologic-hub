import { BotoesOrdemMeta } from './BotoesOrdemMeta'
import { DetalhesMeta } from './DetalhesMeta'
import { ROTULO_UNIDADE_META } from '../lib/unidadeMeta'
import type { Meta } from '../types'

interface Props {
  /** Já na ordem da tela — a mesma usada nas consultas de metas. */
  metas: Meta[]
  aoEditar: (meta: Meta) => void
  aoExcluir: (meta: Meta) => void
  aoOcultar: (meta: Meta, oculta: boolean) => void
  aoTrocarOrdem: (meta: Meta, vizinha: Meta) => void
}

export function TabelaMetas({ metas, aoEditar, aoExcluir, aoOcultar, aoTrocarOrdem }: Props) {
  return (
    <tbody>
      {metas.map((m, i) => (
        <tr key={m.id} className={m.oculta ? 'linha-meta-oculta' : undefined}>
          <td className="cell-material">
            {m.nome}
            {m.oculta ? <span className="meta-periodo meta-oculta-etiqueta">Oculta</span> : null}
            <DetalhesMeta meta={m} />
          </td>
          <td>{m.fornecedor.nome}</td>
          <td>{ROTULO_UNIDADE_META[m.unidade]}</td>
          <td className="actions-cell">
            <div className="row-actions">
              <BotoesOrdemMeta
                meta={m}
                anterior={metas[i - 1] ?? null}
                proxima={metas[i + 1] ?? null}
                aoTrocar={aoTrocarOrdem}
              />
              <button className="btn btn-sm btn-ghost" onClick={() => aoEditar(m)}>
                Editar
              </button>
              <button
                className="btn btn-sm btn-ghost"
                title={m.oculta ? 'Volta a aparecer nas consultas de todo mês' : 'Some das consultas dos meses em que não tem valor de meta, sem apagar nada'}
                onClick={() => aoOcultar(m, !m.oculta)}
              >
                {m.oculta ? 'Mostrar' : 'Ocultar'}
              </button>
              <button className="btn btn-sm btn-ghost btn-danger" onClick={() => aoExcluir(m)}>
                Excluir
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
