import { useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import type { RepresentanteEntrada } from '../../api/api'
import type { Fornecedor, Representante } from '../../types'

interface Props {
  /** Representante em edição, ou null para um cadastro novo. */
  representante: Representante | null
  fornecedores: Fornecedor[]
  aoFechar: () => void
  aoSalvar: (representante: RepresentanteEntrada, id?: string | null) => void
}

export function FormularioRepresentante({ representante, fornecedores, aoFechar, aoSalvar }: Props) {
  const [nome, setNome] = useState(representante?.nome ?? '')
  const [fornecedorIds, setFornecedorIds] = useState<string[]>(
    () => representante?.fornecedores.map((f) => f.id) ?? [],
  )
  const [email, setEmail] = useState(representante?.email ?? '')
  const [celular, setCelular] = useState(representante?.celular ?? '')
  const [codigoAds, setCodigoAds] = useState(representante?.codigoAds ?? '')
  const [erro, setErro] = useState('')

  function alternarFornecedor(id: string, marcado: boolean) {
    setFornecedorIds((atual) => (marcado ? [...atual, id] : atual.filter((f) => f !== id)))
  }

  function confirmar() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return setErro('Informe o nome do representante.')
    if (!fornecedorIds.length) return setErro('Selecione ao menos um fornecedor.')

    aoSalvar(
      { nome: nomeLimpo, fornecedorIds, email: email.trim(), celular: celular.trim(), codigoAds: codigoAds.trim() },
      representante?.id,
    )
    aoFechar()
  }

  return (
    <Modal
      titulo={representante ? 'Editar representante' : 'Cadastrar representante'}
      textoConfirmar="Salvar representante"
      mensagem={erro}
      aoFechar={aoFechar}
      aoConfirmar={confirmar}
    >
      <div className="field">
        <label htmlFor="v-nome">Nome do representante</label>
        <input
          id="v-nome"
          maxLength={80}
          placeholder="Ex.: Maria Souza"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Fornecedores</label>
        {fornecedores.length ? (
          <div className="checklist">
            {fornecedores.map((f) => (
              <label key={f.id}>
                <input
                  type="checkbox"
                  checked={fornecedorIds.includes(f.id)}
                  onChange={(e) => alternarFornecedor(f.id, e.target.checked)}
                />
                {f.nome}
              </label>
            ))}
          </div>
        ) : (
          <p className="hint">Cadastre um fornecedor antes de cadastrar representantes.</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="v-email">E-mail</label>
        <input
          id="v-email"
          type="email"
          maxLength={120}
          placeholder="Ex.: maria@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="v-celular">Celular</label>
        <input
          id="v-celular"
          type="tel"
          maxLength={20}
          placeholder="Ex.: (11) 91234-5678"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="v-codigo-ads">Código ADS</label>
        <input
          id="v-codigo-ads"
          maxLength={20}
          placeholder="Ex.: 073"
          value={codigoAds}
          onChange={(e) => setCodigoAds(e.target.value)}
        />
        <p className="hint">
          Código desse representante na API da ADS (histórico de vendas). Deixe em branco se ele não deve ser
          sincronizado automaticamente.
        </p>
      </div>
    </Modal>
  )
}
