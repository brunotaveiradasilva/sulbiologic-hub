import { useEffect, useRef, useState, type FormEvent } from 'react'
import { criarUsuario, excluirUsuario, listarRepresentantes, listarUsuarios, ErroApi } from '../lib/api'
import type { Representante, Role, UsuarioResumo } from '../types'

interface Props {
  usuarioAtual: string
  aoFechar: () => void
}

/** Perfis na ordem em que aparecem no formulário, com o que cada um pode fazer. */
const PERFIS: { valor: Role; rotulo: string; descricao: string }[] = [
  { valor: 'REPRESENTANTE', rotulo: 'Representante', descricao: 'Consulta só as próprias metas e campanhas.' },
  { valor: 'SUPERVISOR', rotulo: 'Supervisor', descricao: 'Consulta as metas e campanhas de todos os representantes.' },
  { valor: 'ADMIN', rotulo: 'Administrador', descricao: 'Gerencia tudo, inclusive os usuários.' },
  { valor: 'USUARIO', rotulo: 'Almoxarifado', descricao: 'Só materiais e agendamentos.' },
]

function rotuloPerfil(u: UsuarioResumo): string {
  const perfil = PERFIS.find((p) => p.valor === u.role)?.rotulo ?? u.role
  if (u.role !== 'REPRESENTANTE') return perfil
  return `${perfil} · ${u.representanteNome ?? 'representante excluído'}`
}

/**
 * Diálogo próprio (não o <Modal> genérico) porque aqui tem várias ações independentes —
 * excluir cada linha, criar um novo — em vez de um formulário só com "confirmar".
 */
export function PainelUsuarios({ usuarioAtual, aoFechar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([])
  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [novoUsuario, setNovoUsuario] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoPerfil, setNovoPerfil] = useState<Role>('REPRESENTANTE')
  const [novoRepresentanteId, setNovoRepresentanteId] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    carregar()
    listarRepresentantes()
      .then((lista) => setRepresentantes([...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))))
      .catch(() => setErro('Não foi possível carregar os representantes.'))
  }, [])

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setUsuarios(await listarUsuarios())
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível carregar os usuários.')
    } finally {
      setCarregando(false)
    }
  }

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!novoUsuario.trim()) return setErro('Informe o nome do novo usuário.')
    if (novaSenha.length < 4) return setErro('A senha precisa ter pelo menos 4 caracteres.')
    if (novoPerfil === 'REPRESENTANTE' && !novoRepresentanteId) return setErro('Escolha o representante desse login.')

    setErro('')
    setCriando(true)
    try {
      await criarUsuario(
        novoUsuario.trim(),
        novaSenha,
        novoPerfil,
        novoPerfil === 'REPRESENTANTE' ? novoRepresentanteId : null,
      )
      setNovoUsuario('')
      setNovaSenha('')
      setNovoRepresentanteId('')
      await carregar()
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível criar o usuário.')
    } finally {
      setCriando(false)
    }
  }

  async function remover(usuario: string) {
    if (!window.confirm(`Excluir o login "${usuario}"? Essa pessoa não vai mais conseguir entrar.`)) return

    setErro('')
    try {
      await excluirUsuario(usuario)
      await carregar()
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível excluir esse usuário.')
    }
  }

  const admins = usuarios.filter((u) => u.role === 'ADMIN').length

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        aoFechar()
      }}
    >
      <div className="dlg-head">
        <h3>Usuários</h3>
        <button type="button" className="icon-btn" onClick={aoFechar} aria-label="Fechar">
          &times;
        </button>
      </div>

      <div className="dlg-body">
        {carregando ? (
          <p className="hint">Carregando…</p>
        ) : (
          <ul className="lista-usuarios">
            {usuarios.map((u) => {
              const ultimoAdmin = u.role === 'ADMIN' && admins <= 1
              return (
                <li key={u.usuario}>
                  <span className="lista-usuarios-nome">
                    <span>
                      {u.usuario}
                      {u.usuario === usuarioAtual ? <span className="hint"> (você)</span> : null}
                    </span>
                    <span className="hint">{rotuloPerfil(u)}</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-danger"
                    disabled={ultimoAdmin}
                    title={ultimoAdmin ? 'Não dá para excluir o único administrador' : undefined}
                    onClick={() => remover(u.usuario)}
                  >
                    Excluir
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <form className="form-novo-usuario" onSubmit={adicionar}>
          <div className="field">
            <label htmlFor="nu-usuario">Novo usuário</label>
            <input id="nu-usuario" autoComplete="off" value={novoUsuario} onChange={(e) => setNovoUsuario(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="nu-senha">Senha</label>
            <input
              id="nu-senha"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="nu-perfil">Perfil</label>
            <select id="nu-perfil" value={novoPerfil} onChange={(e) => setNovoPerfil(e.target.value as Role)}>
              {PERFIS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </div>
          {novoPerfil === 'REPRESENTANTE' ? (
            <div className="field">
              <label htmlFor="nu-representante">Representante</label>
              <select
                id="nu-representante"
                value={novoRepresentanteId}
                onChange={(e) => setNovoRepresentanteId(e.target.value)}
              >
                <option value="">Escolha…</option>
                {representantes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <p className="hint">
            {PERFIS.find((p) => p.valor === novoPerfil)?.descricao}
          </p>
          <button className="btn btn-primary btn-sm" type="submit" disabled={criando}>
            {criando ? 'Criando…' : '+ Adicionar'}
          </button>
        </form>
      </div>

      <div className="dlg-foot">
        {erro ? <span className="msg">{erro}</span> : null}
        <button type="button" className="btn" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </dialog>
  )
}
