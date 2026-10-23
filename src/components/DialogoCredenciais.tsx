import { useState } from 'react'
import { Modal } from './Modal'
import { copiar, linkWhatsApp, mensagemDeAcesso } from '../lib/credenciais'
import type { LoginGerado } from '../types'

interface Props {
  titulo: string
  logins: LoginGerado[]
  aoFechar: () => void
}

/**
 * Logins com a senha em texto puro, logo depois de gerados: é a única vez que a senha aparece (no banco
 * só fica o hash). Cada um com a mensagem pronta pra copiar ou abrir no WhatsApp.
 */
export function DialogoCredenciais({ titulo, logins, aoFechar }: Props) {
  // Quais já foram copiados/enviados, pra quem manda um por um não se perder na lista.
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [aviso, setAviso] = useState('')

  function marcar(usuario: string) {
    setEnviados((atual) => new Set(atual).add(usuario))
  }

  async function copiarUm(login: LoginGerado) {
    if (await copiar(mensagemDeAcesso(login))) {
      marcar(login.usuario)
      setAviso(`Mensagem de ${login.usuario} copiada.`)
    } else setAviso('O navegador não deixou copiar. Selecione o texto e copie à mão.')
  }

  async function copiarTodos() {
    const texto = logins.map(mensagemDeAcesso).join('\n\n— — —\n\n')
    if (await copiar(texto)) {
      setEnviados(new Set(logins.map((l) => l.usuario)))
      setAviso('Todas as mensagens copiadas.')
    } else setAviso('O navegador não deixou copiar. Selecione o texto e copie à mão.')
  }

  function fechar() {
    const faltam = logins.length - enviados.size
    if (faltam > 0 && !window.confirm(`${faltam} senha(s) ainda não foram copiadas e não vão aparecer de novo. Fechar mesmo assim?`)) return
    aoFechar()
  }

  return (
    <Modal titulo={titulo} textoConfirmar="Concluir" textoCancelar={null} mensagem={aviso} aoFechar={fechar} aoConfirmar={fechar}>
      <p className="hint warn">
        Mande agora: a senha só aparece desta vez. Se perder, use “Nova senha” na lista de usuários.
      </p>

      {logins.length > 1 ? (
        <div className="credenciais-topo">
          <button type="button" className="btn btn-sm" onClick={copiarTodos}>
            Copiar todas as mensagens
          </button>
        </div>
      ) : null}

      <ul className="credenciais-lista">
        {logins.map((l) => {
          const whatsapp = linkWhatsApp(l)
          return (
            <li key={l.usuario} className={enviados.has(l.usuario) ? 'enviado' : undefined}>
              <div className="credenciais-quem">
                <strong>{l.representanteNome || l.nome || l.usuario}</strong>
                {enviados.has(l.usuario) ? <span className="chip devolvido">enviado</span> : null}
              </div>
              <dl className="credenciais-dados">
                <dt>Usuário</dt>
                <dd>
                  <code>{l.usuario}</code>
                </dd>
                <dt>Senha</dt>
                <dd>
                  <code>{l.senha}</code>
                </dd>
              </dl>
              <div className="row-actions">
                <button type="button" className="btn btn-sm" onClick={() => copiarUm(l)}>
                  Copiar mensagem
                </button>
                {whatsapp ? (
                  <a
                    className="btn btn-sm btn-primary"
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => marcar(l.usuario)}
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="hint" title="Cadastre o celular do representante pra mandar direto">
                    sem celular
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
