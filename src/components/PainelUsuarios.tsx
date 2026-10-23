import { useEffect, useState } from 'react'
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  gerarLoginsRepresentantes,
  gerarNovaSenha,
  listarRepresentantes,
  listarUsuarios,
  ErroApi,
} from '../lib/api'
import type { DadosUsuario } from '../lib/api'
import { formatarData, hoje } from '../lib/datas'
import { PERFIS } from '../lib/perfis'
import { DialogoCredenciais } from './DialogoCredenciais'
import { DialogoGerarLogins } from './DialogoGerarLogins'
import { EstadoVazio } from './EstadoVazio'
import { FormularioUsuario } from './FormularioUsuario'
import type { LoginGerado, Representante, Role, UsuarioResumo } from '../types'

interface Props {
  usuarioAtual: string
}

type FiltroUsuarios = 'todos' | Role | 'desativados'

const FILTROS: { valor: FiltroUsuarios; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  ...PERFIS.map((p) => ({ valor: p.valor, rotulo: p.rotulo })),
  { valor: 'desativados', rotulo: 'Desativados' },
]

function mensagemErro(e: unknown, padrao: string): string {
  return e instanceof ErroApi ? e.message : padrao
}

function nomeCompleto(u: UsuarioResumo): string {
  return [u.nome, u.sobrenome].filter(Boolean).join(' ')
}

/** "hoje, 14:32" ou "17/10/2026" — data e hora ISO vindas da API. */
function quando(iso: string): string {
  const d = new Date(iso)
  const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  if (dia !== hoje()) return formatarData(dia)
  return `hoje, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Página de Usuários (só admin): os logins com perfil e dados da pessoa, pra criar, editar e excluir. */
export function PainelUsuarios({ usuarioAtual }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([])
  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroUsuarios>('todos')
  const [formulario, setFormulario] = useState<{ aberto: boolean; usuario: UsuarioResumo | null }>({
    aberto: false,
    usuario: null,
  })
  const [gerandoLogins, setGerandoLogins] = useState(false)
  // Senhas recém-geradas, mostradas uma única vez.
  const [credenciais, setCredenciais] = useState<{ titulo: string; logins: LoginGerado[] } | null>(null)

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

  async function gerarLogins(representanteIds: string[]) {
    let gerados: LoginGerado[]
    try {
      gerados = await gerarLoginsRepresentantes(representanteIds)
    } catch (e) {
      throw new Error(mensagemErro(e, 'Não foi possível gerar os logins.'))
    }
    setGerandoLogins(false)
    setCredenciais({ titulo: `${gerados.length} login(s) gerado(s)`, logins: gerados })
    await carregar()
  }

  async function novaSenha(u: UsuarioResumo) {
    const quem = nomeCompleto(u) || u.usuario
    if (!window.confirm(`Gerar uma senha nova pra ${quem}? A senha atual para de funcionar.`)) return

    setErro('')
    try {
      const gerado = await gerarNovaSenha(u.usuario)
      setCredenciais({ titulo: `Nova senha de ${quem}`, logins: [gerado] })
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível gerar a senha nova.'))
    }
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

  const admins = usuarios.filter((u) => u.role === 'ADMIN' && u.ativo).length
  const comLogin = new Set(usuarios.filter((u) => u.role === 'REPRESENTANTE').map((u) => u.representanteId))
  const semLogin = representantes.filter((r) => !comLogin.has(r.id))
  const termo = busca.trim().toLowerCase()
  const visiveis = usuarios.filter(
    (u) =>
      (filtro === 'todos' || (filtro === 'desativados' ? !u.ativo : u.role === filtro)) &&
      (!termo ||
        [u.usuario, nomeCompleto(u), u.email, u.celular, u.representanteNome].some((t) => t?.toLowerCase().includes(termo))),
  )

  return (
    <section className="view" role="tabpanel">
      <div className="view-head">
        <div>
          <h2>Usuários</h2>
          <p>
            Quem entra no sistema e o que cada um pode ver.
            {representantes.length ? (
              <>
                {' '}
                {semLogin.length
                  ? `${semLogin.length} de ${representantes.length} representantes ainda sem login.`
                  : 'Todos os representantes têm login.'}
              </>
            ) : null}
          </p>
        </div>
        <div className="row-actions">
          <button className="btn" onClick={() => setGerandoLogins(true)} disabled={!representantes.length}>
            Gerar logins dos representantes
          </button>
          <button className="btn btn-primary" onClick={() => setFormulario({ aberto: true, usuario: null })}>
            + Novo usuário
          </button>
        </div>
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
          placeholder="Buscar por nome, usuário, e-mail, celular ou representante…"
          aria-label="Buscar usuários"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="filters">
          {FILTROS.map((f) => (
            <button key={f.valor} aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
              {f.rotulo}
            </button>
          ))}
        </div>
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
                <th>Contato</th>
                <th>Último acesso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visiveis.map((u) => {
                const ultimoAdmin = u.role === 'ADMIN' && u.ativo && admins <= 1
                return (
                  <tr key={u.usuario} className={u.ativo ? undefined : 'is-done'}>
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
                      {!u.ativo ? <span className="chip atrasado">desativado</span> : null}
                    </td>
                    <td className="cell-obs">
                      {u.celular || u.email ? (
                        <>
                          {u.celular ? <span className="usuario-contato">{u.celular}</span> : null}
                          {u.email ? <span className="usuario-contato">{u.email}</span> : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="cell-obs">
                      {u.ultimoAcesso ? quando(u.ultimoAcesso) : <span className="hint">nunca entrou</span>}
                      {u.dataNascimento ? (
                        <span className="usuario-login">nasc. {formatarData(u.dataNascimento)}</span>
                      ) : null}
                    </td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => setFormulario({ aberto: true, usuario: u })}>
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          title="Troca a senha por uma aleatória, pra mandar pra pessoa"
                          onClick={() => novaSenha(u)}
                        >
                          Nova senha
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
            <EstadoVazio titulo="Ninguém por aqui" texto="Tente outro termo ou outro filtro." />
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

      {gerandoLogins ? (
        <DialogoGerarLogins semLogin={semLogin} aoFechar={() => setGerandoLogins(false)} aoGerar={gerarLogins} />
      ) : null}

      {credenciais ? (
        <DialogoCredenciais
          titulo={credenciais.titulo}
          logins={credenciais.logins}
          aoFechar={() => setCredenciais(null)}
        />
      ) : null}
    </section>
  )
}
