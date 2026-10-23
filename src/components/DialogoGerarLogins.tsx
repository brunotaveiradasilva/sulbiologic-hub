import { useState } from 'react'
import { Modal } from './Modal'
import type { Representante } from '../types'

interface Props {
  /** Só os representantes que ainda não têm login. */
  semLogin: Representante[]
  aoFechar: () => void
  /** Rejeita com a mensagem de erro, que fica no próprio diálogo. */
  aoGerar: (representanteIds: string[]) => Promise<void>
}

/** Escolhe quais representantes ganham login agora — todos marcados de início. */
export function DialogoGerarLogins({ semLogin, aoFechar, aoGerar }: Props) {
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set(semLogin.map((r) => r.id)))
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)

  function alternar(id: string) {
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  async function confirmar() {
    if (gerando) return
    if (!semLogin.length) return aoFechar()
    if (!marcados.size) return setErro('Marque pelo menos um representante.')
    setErro('')
    setGerando(true)
    try {
      await aoGerar([...marcados])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar os logins.')
      setGerando(false)
    }
  }

  const texto = gerando
    ? 'Gerando…'
    : !semLogin.length
      ? 'Fechar'
      : `Gerar ${marcados.size} login${marcados.size === 1 ? '' : 's'}`

  return (
    <Modal
      titulo="Logins dos representantes"
      textoConfirmar={texto}
      textoCancelar={semLogin.length ? 'Cancelar' : null}
      mensagem={erro}
      aoFechar={aoFechar}
      aoConfirmar={confirmar}
    >
      {semLogin.length ? (
        <>
          <p className="hint">
            Cada um ganha um usuário (nome.sobrenome) e uma senha aleatória, e só enxerga as próprias metas e
            campanhas. Nome, e-mail e celular vêm do cadastro do representante.
          </p>
          <div className="field">
            <div className="credenciais-topo">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMarcados(new Set(semLogin.map((r) => r.id)))}>
                Marcar todos
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMarcados(new Set())}>
                Desmarcar todos
              </button>
            </div>
            <div className="checklist checklist-alta">
              {semLogin.map((r) => (
                <label key={r.id}>
                  <input type="checkbox" checked={marcados.has(r.id)} onChange={() => alternar(r.id)} />
                  <span>
                    {r.nome}
                    {!r.celular ? <span className="hint"> · sem celular</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p>Todos os representantes já têm login. Pra mandar o acesso de novo, use “Nova senha” na linha da pessoa.</p>
      )}
    </Modal>
  )
}
