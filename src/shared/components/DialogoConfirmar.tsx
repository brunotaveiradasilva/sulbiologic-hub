import { useState, type ReactNode } from 'react'
import { Modal } from './Modal'

interface ConfirmarProps {
  titulo: string
  textoConfirmar: string
  /** Rejeita com a mensagem de erro, que fica no próprio diálogo (sem fechar). */
  aoConfirmar: () => Promise<void>
  aoFechar: () => void
  children: ReactNode
}

/** "Tem certeza?" antes de gravar: mostra o que vai mudar e só fecha quando a API confirmou. */
export function DialogoConfirmar({ titulo, textoConfirmar, aoConfirmar, aoFechar, children }: ConfirmarProps) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    if (salvando) return
    setErro('')
    setSalvando(true)
    try {
      await aoConfirmar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <Modal
      titulo={titulo}
      textoConfirmar={salvando ? 'Salvando…' : textoConfirmar}
      textoCancelar="Voltar"
      mensagem={erro}
      aoFechar={salvando ? () => {} : aoFechar}
      aoConfirmar={confirmar}
    >
      {children}
    </Modal>
  )
}

interface SucessoProps {
  titulo: string
  aoFechar: () => void
  children: ReactNode
}

/** Aviso de que deu certo, com um botão só. */
export function DialogoSucesso({ titulo, aoFechar, children }: SucessoProps) {
  return (
    <Modal titulo={titulo} textoConfirmar="OK" textoCancelar={null} aoFechar={aoFechar} aoConfirmar={aoFechar}>
      <div className="dialogo-sucesso">
        <span className="dialogo-sucesso-icone" aria-hidden="true">
          ✓
        </span>
        <div>{children}</div>
      </div>
    </Modal>
  )
}
