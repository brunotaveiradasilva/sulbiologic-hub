import { useEffect, useRef, type ReactNode } from 'react'
import { StatusChip } from './StatusChip'
import { diaDaSemana, diasEntre, formatarData, hoje } from '../../shared/lib/datas'
import { buscarMaterial, statusExibido } from './regras'
import type { Agendamento, Material, Status } from '../../types'

interface Props {
  agendamento: Agendamento
  materiais: Material[]
  aoFechar: () => void
  aoEditar: () => void
  aoExcluir: () => void
  aoMudarStatus: (id: string, status: Status) => void
}

function Item({ rotulo, span, children }: { rotulo: string; span?: boolean; children: ReactNode }) {
  return (
    <div className={`detail-item${span ? ' span-2' : ''}`}>
      <span className="detail-label">{rotulo}</span>
      <span className="detail-value">{children}</span>
    </div>
  )
}

/** Visão só de leitura de um agendamento, aberta ao clicar na linha da tabela. */
export function DetalhesAgendamento({ agendamento, materiais, aoFechar, aoEditar, aoExcluir, aoMudarStatus }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const status = statusExibido(agendamento)
  const material = buscarMaterial(materiais, agendamento.materialId)
  const atraso = status === 'atrasado' ? diasEntre(agendamento.devolucao, hoje()) : 0

  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); aoFechar() }}>
      <div className="dlg-head">
        <h3>Detalhes do agendamento</h3>
        <button type="button" className="icon-btn" onClick={aoFechar} aria-label="Fechar">
          &times;
        </button>
      </div>

      <div className="dlg-body">
        <div className="detail-grid">
          <Item rotulo="Material">
            {material?.nome ?? 'Material removido'}
            {material?.codigo ? <span className="cell-code">{material.codigo}</span> : null}
          </Item>
          <Item rotulo="Quantidade">{agendamento.qtd}</Item>

          <Item rotulo="Responsável">{agendamento.responsavel}</Item>
          <Item rotulo="Cliente">{agendamento.cliente || '—'}</Item>

          <Item rotulo="Retirada">
            {formatarData(agendamento.retirada)} · {diaDaSemana(agendamento.retirada)}
          </Item>
          <Item rotulo="Devolução">
            {formatarData(agendamento.devolucao)} · {diaDaSemana(agendamento.devolucao)}
          </Item>

          <Item rotulo="Status">
            <StatusChip status={status} />
            {atraso ? <span className="cell-code">{atraso === 1 ? '1 dia de atraso' : `${atraso} dias de atraso`}</span> : null}
          </Item>

          <Item rotulo="Observação" span>
            {agendamento.obs || '—'}
          </Item>
        </div>
      </div>

      <div className="dlg-foot">
        <button type="button" className="btn btn-ghost btn-danger" onClick={() => { aoExcluir(); aoFechar() }}>
          Excluir
        </button>
        {agendamento.status === 'agendado' ? (
          <button type="button" className="btn" onClick={() => { aoMudarStatus(agendamento.id, 'retirado'); aoFechar() }}>
            Marcar retirado
          </button>
        ) : null}
        {agendamento.status === 'retirado' ? (
          <button type="button" className="btn" onClick={() => { aoMudarStatus(agendamento.id, 'devolvido'); aoFechar() }}>
            Marcar devolvido
          </button>
        ) : null}
        <button type="button" className="btn" onClick={aoFechar}>
          Fechar
        </button>
        <button type="button" className="btn btn-primary" onClick={aoEditar}>
          Editar
        </button>
      </div>
    </dialog>
  )
}
