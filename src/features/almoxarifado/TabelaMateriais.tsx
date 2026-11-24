import { quantidadeEmPosse } from './regras'
import type { Agendamento, Material } from '../../types'

interface Props {
  materiais: Material[]
  agendamentos: Agendamento[]
  aoAgendar: (materialId: string) => void
  aoEditar: (material: Material) => void
  aoExcluir: (material: Material) => void
}

export function TabelaMateriais({ materiais, agendamentos, aoAgendar, aoEditar, aoExcluir }: Props) {
  return (
    <tbody>
      {materiais.map((m) => {
        const fora = quantidadeEmPosse(agendamentos, m.id)
        const proporcao = m.estoque ? Math.min(100, (fora / m.estoque) * 100) : 0

        return (
          <tr key={m.id}>
            <td className="cell-material">
              {m.nome}
              {m.codigo ? <span className="cell-code">{m.codigo}</span> : null}
            </td>
            <td className="num">{m.estoque}</td>
            <td className="num">
              {fora} de {m.estoque}
              <div className="stock-bar">
                <i
                  style={{
                    width: `${proporcao}%`,
                    background: fora > m.estoque ? 'var(--st-atrasado)' : undefined,
                  }}
                />
              </div>
            </td>
            <td className="cell-obs">{m.obs || '—'}</td>
            <td className="actions-cell">
              <div className="row-actions">
                <button className="btn btn-sm" onClick={() => aoAgendar(m.id)}>
                  Agendar
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => aoEditar(m)}>
                  Editar
                </button>
                <button className="btn btn-sm btn-ghost btn-danger" onClick={() => aoExcluir(m)}>
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
