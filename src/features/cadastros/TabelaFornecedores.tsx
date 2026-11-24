import type { Fornecedor } from '../../types'

interface Props {
  fornecedores: Fornecedor[]
  aoEditar: (fornecedor: Fornecedor) => void
  aoExcluir: (fornecedor: Fornecedor) => void
}

export function TabelaFornecedores({ fornecedores, aoEditar, aoExcluir }: Props) {
  return (
    <tbody>
      {fornecedores.map((f) => (
        <tr key={f.id}>
          <td className="cell-material">{f.nome}</td>
          <td className="actions-cell">
            <div className="row-actions">
              <button className="btn btn-sm btn-ghost" onClick={() => aoEditar(f)}>
                Editar
              </button>
              <button className="btn btn-sm btn-ghost btn-danger" onClick={() => aoExcluir(f)}>
                Excluir
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
