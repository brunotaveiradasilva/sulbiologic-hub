import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  titulo: string
  aoFechar: () => void
  aoConfirmar: () => void
  textoConfirmar: string
  /** Texto do botão secundário; null esconde o botão (ex.: tela de "deu certo", que só tem o de fechar). */
  textoCancelar?: string | null
  /** Ação do botão secundário, quando não for simplesmente fechar (ex.: "Voltar" um passo). */
  aoCancelar?: () => void
  mensagem?: string
  children: ReactNode
}

/**
 * Janela de formulário sobre o elemento nativo <dialog>: já vem com
 * foco preso dentro dela, fundo escurecido e fechamento pelo Esc.
 */
export function Modal({
  titulo,
  aoFechar,
  aoConfirmar,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  aoCancelar,
  mensagem,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  // O componente só existe enquanto o diálogo deve estar aberto:
  // abre ao montar e o navegador fecha junto com a desmontagem.
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); aoFechar() }}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          aoConfirmar()
        }}
      >
        <div className="dlg-head">
          <h3>{titulo}</h3>
          <button type="button" className="icon-btn" onClick={aoFechar} aria-label="Fechar">
            &times;
          </button>
        </div>

        <div className="dlg-body">{children}</div>

        <div className="dlg-foot">
          {mensagem ? <span className="msg">{mensagem}</span> : null}
          {textoCancelar !== null ? (
            <button type="button" className="btn" onClick={aoCancelar ?? aoFechar}>
              {textoCancelar}
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            {textoConfirmar}
          </button>
        </div>
      </form>
    </dialog>
  )
}
