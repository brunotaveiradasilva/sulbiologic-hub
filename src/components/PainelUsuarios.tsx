import { useEffect, useState } from 'react'
import { atualizarUsuario, criarUsuario, excluirUsuario, listarRepresentantes, listarUsuarios, ErroApi } from '../lib/api'
import type { DadosUsuario } from '../lib/api'
import { formatarData } from '../lib/datas'
import { PERFIS } from '../lib/perfis'
import { EstadoVazio } from './EstadoVazio'
import { FormularioUsuario } from './FormularioUsuario'
import type { Representante, UsuarioResumo } from '../types'

interface Props {
  usuarioAtual: string
}

function mensagemErro(e: unknown, padrao: string): string {
  return e instanceof ErroApi ? e.message : padrao
}

function nomeCompleto(u: UsuarioResumo): string {
  return [u.nome, u.sobrenome].filter(Boolean).join(' ')
}

/** Página de Usuários (só admin): os logins com perfil e dados da pessoa, pra criar, editar e excluir. */
export function PainelUsuarios({ usuarioAtual }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([])
  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [formulario, setFormulario] = useState<{ aberto: boolean; usuario: UsuarioResumo | null }>({
    aberto: false,
    usuario: null,
  })

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
      setErro(mensagemErro(e, 'Não foi possível carregar os usuários.'))
    } finally {
      setCarregando(false)
    }
  }

  /** Erro aqui sobe pro formulário, que mostra a mensagem sem fechar. */
  async function salvar(usuario: string, senha: string, dados: DadosUsuario) {
    try {
      if (formulario.usuario) await atualizarUsuario(formulario.usuario.usuario, dados, senha)
      else await criarUsuario(usuario, senha, dados)
    } catch (e) {
      throw new Error(mensagemErro(e, 'Não foi possível salvar o usuário.'))
    }
    await carregar()
  }

  async function remover(u: UsuarioResumo) {
    const quem = nomeCompleto(u) || u.usuario
    if (!window.confirm(`Excluir o login de ${quem}? Essa pessoa não vai mais conseguir entrar.`)) return

    setErro('')
    try {
      await excluirUsuario(u.usuario)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível excluir esse usuário.'))
    }
  }

  const admins = usuarios.filter((u) => u.role === 'ADMIN').length
  const termo = busca.trim().toLowerCase()
  const visiveis = usuarios.filter(
    (u) =>
      !termo ||
      [u.usuario, nomeCompleto(u), u.email, u.representanteNome].some((t) => t?.toLowerCase().includes(termo)),
  )

  return (
    <section className="view" role="tabpanel">
      <div className="view-head">
        <div>
          <h2>Usuários</h2>
          <p>Quem entra no sistema e o que cada um pode ver.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormulario({ aberto: true, usuario: null })}>
          + Novo usuário
        </button>
      </div>

      {erro ? (
        <div className="banner-erro" role="alert">
          <span>{erro}</span>
          <button className="btn" onClick={carregar}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar por nome, usuário, e-mail ou representante…"
          aria-label="Buscar usuários"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando && !usuarios.length ? (
        <EstadoVazio titulo="Carregando…" texto="Buscando os usuários no servidor." />
      ) : (
        <div className="table-wrap table-wrap-compacta">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Perfil</th>
                <th>E-mail</th>
                <th>Nascimento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visiveis.map((u) => {
                const ultimoAdmin = u.role === 'ADMIN' && admins <= 1
                return (
                  <tr key={u.usuario}>
                    <td className="cell-material">
                      {nomeCompleto(u) || u.usuario}
                      {u.usuario === usuarioAtual ? <span className="hint"> (você)</span> : null}
                      <span className="usuario-login">{u.usuario}</span>
                    </td>
                    <td className="cell-obs">
                      {PERFIS.find((p) => p.valor === u.role)?.rotulo ?? u.role}
                      {u.role === 'REPRESENTANTE' ? (
                        <span className="usuario-representante">{u.representanteNome ?? 'representante excluído'}</span>
                      ) : null}
                    </td>
                    <td className="cell-obs">{u.email || '—'}</td>
                    <td className="cell-obs">{u.dataNascimento ? formatarData(u.dataNascimento) : '—'}</td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => setFormulario({ aberto: true, usuario: u })}>
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-ghost btn-danger"
                          disabled={ultimoAdmin}
                          title={ultimoAdmin ? 'Não dá para excluir o único administrador' : undefined}
                          onClick={() => remover(u)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!visiveis.length ? (
            <EstadoVazio titulo="Ninguém com esse termo" texto="Tente outro nome, usuário ou e-mail." />
          ) : null}
        </div>
      )}

      {formulario.aberto ? (
        <FormularioUsuario
          usuario={formulario.usuario}
          representantes={representantes}
          aoFechar={() => setFormulario({ aberto: false, usuario: null })}
          aoSalvar={salvar}
        />
      ) : null}
    </section>
  )
}
