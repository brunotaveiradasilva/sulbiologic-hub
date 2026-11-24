import { useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import { rotuloMes } from '../../shared/lib/mes'
import { ROTULO_UNIDADE_META } from '../../shared/lib/unidadeMeta'
import { ErroApi, type MetaRepresentanteEntrada } from '../../api/api'
import type { Meta, MetaRepresentante, Representante } from '../../types'

interface Props {
  representante: Representante
  meta: Meta
  /** Mês ("2026-09") em que o valor vale. */
  mes: string
  atribuicao: MetaRepresentante | null
  aoFechar: () => void
  aoSalvar: (mv: MetaRepresentanteEntrada, id?: string | null) => Promise<MetaRepresentante>
}

const formatar = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

/** Troca o valor da meta de um representante em três passos: digitar o valor, confirmar a mudança e ver que deu certo. */
export function DialogoEditarMetaRepresentante({ representante, meta, mes, atribuicao, aoFechar, aoSalvar }: Props) {
  const valorAtual = atribuicao?.valorMeta ?? 0
  const [passo, setPasso] = useState<'editar' | 'confirmar' | 'sucesso'>('editar')
  const [valor, setValor] = useState(atribuicao?.valorMeta ? String(atribuicao.valorMeta) : '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const valorNum = Number.parseFloat(valor)
  const contagem = meta.unidade === 'CLIENTES'

  function continuar() {
    if (!Number.isFinite(valorNum) || valorNum < 0) return setErro('Informe um valor de meta válido.')
    if (contagem && !Number.isInteger(valorNum)) return setErro('Meta de clientes é um número inteiro.')
    if (valorNum === valorAtual) return setErro('O valor é igual ao atual.')
    setErro('')
    setPasso('confirmar')
  }

  async function salvar() {
    if (salvando) return
    setSalvando(true)
    setErro('')
    try {
      await aoSalvar({ representanteId: representante.id, metaId: meta.id, mes, valorMeta: valorNum }, atribuicao?.id)
      setPasso('sucesso')
    } catch (e) {
      // Ex.: o mês fechou com a tela aberta — a API explica o motivo.
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const descricao = (
    <>
      <strong>{representante.nome}</strong> · {meta.nome} ({ROTULO_UNIDADE_META[meta.unidade]}) em {rotuloMes(mes)}
    </>
  )

  if (passo === 'sucesso') {
    return (
      <Modal titulo="Meta alterada" textoConfirmar="Fechar" textoCancelar={null} aoFechar={aoFechar} aoConfirmar={aoFechar}>
        <p>
          Deu certo! A meta de {descricao} agora é <strong>{formatar(valorNum)}</strong>.
        </p>
      </Modal>
    )
  }

  if (passo === 'confirmar') {
    return (
      <Modal
        titulo="Confirmar alteração"
        textoConfirmar={salvando ? 'Salvando…' : 'Confirmar'}
        textoCancelar="Voltar"
        aoCancelar={() => setPasso('editar')}
        mensagem={erro}
        aoFechar={aoFechar}
        aoConfirmar={salvar}
      >
        <p>
          Alterar a meta de {descricao} de <strong>{formatar(valorAtual)}</strong> para{' '}
          <strong>{formatar(valorNum)}</strong>?
        </p>
      </Modal>
    )
  }

  return (
    <Modal titulo="Editar meta" textoConfirmar="Continuar" mensagem={erro} aoFechar={aoFechar} aoConfirmar={continuar}>
      <p className="hint">{descricao}</p>
      <div className="field">
        <label htmlFor="emr-valor">Valor da meta</label>
        <input
          id="emr-valor"
          type="number"
          min={0}
          step={contagem ? 1 : 'any'}
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>
    </Modal>
  )
}
