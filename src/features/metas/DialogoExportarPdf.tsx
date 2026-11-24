import { useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import type { Fornecedor } from '../../types'

interface Props {
  fornecedores: Fornecedor[]
  aoFechar: () => void
  aoExportar: (fornecedorIds: string[]) => void
}

/** Escolhe quais fornecedores entram no PDF — começa com todos marcados. */
export function DialogoExportarPdf({ fornecedores, aoFechar, aoExportar }: Props) {
  const [marcados, setMarcados] = useState<string[]>(() => fornecedores.map((f) => f.id))
  const [erro, setErro] = useState('')

  function alternar(id: string, marcado: boolean) {
    setErro('')
    setMarcados((atual) => (marcado ? [...atual, id] : atual.filter((f) => f !== id)))
  }

  function confirmar() {
    if (!marcados.length) return setErro('Selecione ao menos um fornecedor.')
    // Mantém a ordem da tela, não a ordem em que foram marcados.
    aoExportar(fornecedores.filter((f) => marcados.includes(f.id)).map((f) => f.id))
    aoFechar()
  }

  return (
    <Modal titulo="Exportar PDF" textoConfirmar="Gerar PDF" mensagem={erro} aoFechar={aoFechar} aoConfirmar={confirmar}>
      <div className="field">
        <label>Fornecedores no relatório</label>
        <div className="checklist">
          {fornecedores.map((f) => (
            <label key={f.id}>
              <input type="checkbox" checked={marcados.includes(f.id)} onChange={(e) => alternar(f.id, e.target.checked)} />
              {f.nome}
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}
