import { useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import type { Fornecedor } from '../../types'

interface Props {
  /** Fornecedor em edição, ou null para um cadastro novo. */
  fornecedor: Fornecedor | null
  aoFechar: () => void
  aoSalvar: (fornecedor: Omit<Fornecedor, 'id'>, id?: string | null) => void
}

export function FormularioFornecedor({ fornecedor, aoFechar, aoSalvar }: Props) {
  const [nome, setNome] = useState(fornecedor?.nome ?? '')
  const [erro, setErro] = useState('')

  function confirmar() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return setErro('Informe o nome do fornecedor.')

    aoSalvar({ nome: nomeLimpo }, fornecedor?.id)
    aoFechar()
  }

  return (
    <Modal
      titulo={fornecedor ? 'Editar fornecedor' : 'Cadastrar fornecedor'}
      textoConfirmar="Salvar fornecedor"
      mensagem={erro}
      aoFechar={aoFechar}
      aoConfirmar={confirmar}
    >
      <div className="field">
        <label htmlFor="f-nome">Nome do fornecedor</label>
        <input
          id="f-nome"
          maxLength={80}
          placeholder="Ex.: Distribuidora Central"
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
    </Modal>
  )
}
