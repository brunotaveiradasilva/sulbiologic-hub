import { StatusChip } from './StatusChip'
import { diaDaSemana, diasEntre, formatarData, hoje } from '../../shared/lib/datas'
import { buscarMaterial, statusExibido } from './regras'
import type { Agendamento, Material, Status } from '../../types'

interface Props {
  agendamentos: Agendamento[]
  materiais: Material[]
  aoMudarStatus: (id: string, status: Status) => void
  aoVerDetalhes: (agendamento: Agendamento) => void
  aoEditar: (agendamento: Agendamento) => void
  aoExcluir: (id: string) => void
}

function Data({ iso }: { iso: string }) {
  return (
    <>
      {formatarData(iso)}
      <span className="weekday">{diaDaSemana(iso)}</span>
    </>
  )
}

export function TabelaAgendamentos({ agendamentos, materiais, aoMudarStatus, aoVerDetalhes, aoEditar, aoExcluir }: Props) {
  return (
    <tbody>
      {agendamentos.map((a) => {
        const status = statusExibido(a)
        const material = buscarMaterial(materiais, a.materialId)
        const atraso = status === 'atrasado' ? diasEntre(a.devolucao, hoje()) : 0

        return (
          <tr
            key={a.id}
            className={status === 'atrasado' ? 'is-late' : status === 'devolvido' ? 'is-done' : undefined}
            onClick={() => aoVerDetalhes(a)}
          >
            <td className="cell-material">
              {material?.nome ?? 'Material removido'}
              {material?.codigo ? <span className="cell-code">{material.codigo}</span> : null}
            </td>
            <td className="num">{a.qtd}</td>
            <td>{a.responsavel}</td>
            <td className={a.cliente ? undefined : 'cell-obs'}>{a.cliente || '—'}</td>
            <td className="date">
              <Data iso={a.retirada} />
            </td>
            <td className="date">
              <Data iso={a.devolucao} />
            </td>
            <td>
              <StatusChip status={status} />
              {atraso ? <div className="cell-code">{atraso === 1 ? '1 dia' : `${atraso} dias`}</div> : null}
            </td>
            <td className="cell-obs">{a.obs || '—'}</td>
            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
              <div className="row-actions">
                {a.status === 'agendado' ? (
                  <button className="btn btn-sm" onClick={() => aoMudarStatus(a.id, 'retirado')}>
                    Retirou
                  </button>
                ) : null}
                {a.status === 'retirado' ? (
                  <button className="btn btn-sm" onClick={() => aoMudarStatus(a.id, 'devolvido')}>
                    Devolveu
                  </button>
                ) : null}
                <button className="btn btn-sm btn-ghost" onClick={() => aoEditar(a)}>
                  Editar
                </button>
                <button className="btn btn-sm btn-ghost btn-danger" onClick={() => aoExcluir(a.id)}>
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        )
      })}
    </tbody>
  )
}
