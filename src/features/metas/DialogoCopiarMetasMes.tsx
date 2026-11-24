import { useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import { ErroApi } from '../../api/api'
import { rotuloMes } from '../../shared/lib/mes'

interface Props {
  de: string
  para: string
  fornecedorNome: string
  /** Quantas metas vão ser copiadas (as que o mês de destino ainda não tem). */
  quantidade: number
  aoCopiar: () => Promise<number>
  aoFechar: () => void
}

/** Confirma a cópia das metas de um mês pro outro e mostra que deu certo. */
export function DialogoCopiarMetasMes({ de, para, fornecedorNome, quantidade, aoCopiar, aoFechar }: Props) {
  const [copiadas, setCopiadas] = useState<number | null>(null)
  const [copiando, setCopiando] = useState(false)
  const [erro, setErro] = useState('')

  async function copiar() {
    if (copiando) return
    setCopiando(true)
    setErro('')
    try {
      setCopiadas(await aoCopiar())
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível copiar. Tente de novo.')
    } finally {
      setCopiando(false)
    }
  }

  if (copiadas !== null) {
    return (
      <Modal titulo="Metas copiadas" textoConfirmar="Fechar" textoCancelar={null} aoFechar={aoFechar} aoConfirmar={aoFechar}>
        <p>
          Deu certo! {copiadas} meta(s) de <strong>{fornecedorNome}</strong> copiada(s) pra {rotuloMes(para)}. Agora é só
          ajustar pelo botão Editar o que mudou.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      titulo="Copiar metas do mês anterior"
      textoConfirmar={copiando ? 'Copiando…' : 'Copiar metas'}
      mensagem={erro}
      aoFechar={aoFechar}
      aoConfirmar={copiar}
    >
      <p>
        Copiar {quantidade} meta(s) de <strong>{fornecedorNome}</strong> de {rotuloMes(de)} pra{' '}
        <strong>{rotuloMes(para)}</strong>?
      </p>
      <p className="hint">
        Só entram os representantes que ainda não têm meta em {rotuloMes(para)} — nada que já foi cadastrado é
        sobrescrito. O realizado começa zerado e vem na sincronização com a ADS.
      </p>
    </Modal>
  )
}
