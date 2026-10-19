import { DetalhesMeta } from './DetalhesMeta'
import { Realizado } from './Realizado'
import { formatarValorMeta } from '../lib/unidadeMeta'
import type { Meta, MetaRepresentante } from '../types'

interface Props {
  representanteNome: string
  meta: Meta
  atribuicao: MetaRepresentante | null
  /** null em mês fechado: a linha fica só pra consulta, sem o botão Editar. */
  aoEditar: (() => void) | null
}

/**
 * Linha da tabela de metas (um representante × uma meta). O valor da Meta muda pelo botão Editar (abre um
 * diálogo com confirmação); o Realizado chega da API (sincronização com a ADS) e é só leitura.
 */
export function LinhaMetaRepresentante({ representanteNome, meta, atribuicao, aoEditar }: Props) {
  const metaNum = atribuicao?.valorMeta ?? 0
  const realizadoNum = atribuicao?.valorRealizado ?? 0
  const falta = Math.max(0, metaNum - realizadoNum)
  const formatar = (n: number) => formatarValorMeta(n, meta.unidade)
  const percentual = metaNum > 0 ? (realizadoNum / metaNum) * 100 : null

  return (
    <tr>
      <td className="cell-material">{representanteNome}</td>
      <td>
        {meta.nome}
        <DetalhesMeta meta={meta} />
      </td>
      {/* Meta 0 é "sem meta": a sincronização cria a linha só pra guardar o realizado. */}
      <td className="num">{percentual === null ? '—' : formatar(metaNum)}</td>
      <td className="num">
        <Realizado meta={meta} atribuicao={atribuicao} texto={formatar(realizadoNum)} />
      </td>
      <td className="num">{percentual === null ? '—' : formatar(falta)}</td>
      <td className="num">
        <div className="meta-progress-cell">
          <span className="meta-progress-track">
            <span
              className={`meta-progress-fill${(percentual ?? 0) >= 100 ? ' is-complete' : ''}`}
              style={{ width: `${Math.min(percentual ?? 0, 100)}%` }}
            />
          </span>
          <span className="meta-progress-pct">
            {percentual === null ? '—' : `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`}
          </span>
        </div>
      </td>
      <td className="actions-cell">
        {aoEditar ? (
          <div className="row-actions">
            <button className="btn btn-sm btn-ghost" onClick={aoEditar}>
              Editar
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  )
}
