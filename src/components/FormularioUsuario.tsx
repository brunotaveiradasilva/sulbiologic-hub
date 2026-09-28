import { useState } from 'react'
import { Modal } from './Modal'
import { hoje } from '../lib/datas'
import { PERFIS } from '../lib/perfis'
import type { DadosUsuario } from '../lib/api'
import type { Representante, Role, UsuarioResumo } from '../types'

interface Props {
  /** Login em edição, ou null pra um novo. */
  usuario: UsuarioResumo | null
  representantes: Representante[]
  aoFechar: () => void
  /** Resolve quando a API confirmou; rejeita com a mensagem de erro, que fica no próprio diálogo. */
  aoSalvar: (usuario: string, senha: string, dados: DadosUsuario) => Promise<void>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function FormularioUsuario({ usuario, representantes, aoFechar, aoSalvar }: Props) {
  const editando = usuario !== null
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [sobrenome, setSobrenome] = useState(usuario?.sobrenome ?? '')
  const [login, setLogin] = useState(usuario?.usuario ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [dataNascimento, setDataNascimento] = useState(usuario?.dataNascimento ?? '')
  const [role, setRole] = useState<Role>(usuario?.role ?? 'REPRESENTANTE')
  const [representanteId, setRepresentanteId] = useState(usuario?.representanteId ?? '')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    if (salvando) return
    if (!nome.trim()) return setErro('Informe o nome.')
    if (!sobrenome.trim()) return setErro('Informe o sobrenome.')
    if (!login.trim()) return setErro('Informe o nome de usuário.')
    if (email.trim() && !EMAIL.test(email.trim())) return setErro('Esse e-mail não parece válido.')
    if (dataNascimento && dataNascimento >= hoje()) return setErro('A data de nascimento precisa ser no passado.')
    if (role === 'REPRESENTANTE' && !representanteId) return setErro('Escolha o representante desse login.')
    if (!editando && senha.length < 4) return setErro('A senha precisa ter pelo menos 4 caracteres.')
    if (editando && senha && senha.length < 4) return setErro('A nova senha precisa ter pelo menos 4 caracteres.')

    setErro('')
    setSalvando(true)
    try {
      await aoSalvar(login.trim(), senha, {
        role,
        representanteId: role === 'REPRESENTANTE' ? representanteId : null,
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: email.trim(),
        dataNascimento: dataNascimento || null,
      })
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o usuário.')
      setSalvando(false)
    }
  }

  return (
    <Modal
      titulo={editando ? `Editar ${usuario.usuario}` : 'Novo usuário'}
      textoConfirmar={salvando ? 'Salvando…' : 'Salvar usuário'}
      mensagem={erro}
      aoFechar={aoFechar}
      aoConfirmar={confirmar}
    >
      <div className="grid-2">
        <div className="field">
          <label htmlFor="u-nome">Nome</label>
          <input id="u-nome" maxLength={80} autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="u-sobrenome">Sobrenome</label>
          <input
            id="u-sobrenome"
            maxLength={80}
            autoComplete="off"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="u-email">E-mail</label>
          <input
            id="u-email"
            type="email"
            maxLength={120}
            autoComplete="off"
            placeholder="Opcional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="u-nascimento">Data de nascimento</label>
          <input
            id="u-nascimento"
            type="date"
            max={hoje()}
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="u-perfil">Perfil</label>
          <select id="u-perfil" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {PERFIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </div>
        {role === 'REPRESENTANTE' ? (
          <div className="field">
            <label htmlFor="u-representante">Representante</label>
            <select id="u-representante" value={representanteId} onChange={(e) => setRepresentanteId(e.target.value)}>
              <option value="">Escolha…</option>
              {representantes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <p className="hint">{PERFIS.find((p) => p.valor === role)?.descricao}</p>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="u-login">Usuário</label>
          <input
            id="u-login"
            maxLength={60}
            autoComplete="off"
            disabled={editando}
            placeholder="Ex.: renata.vargas"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="u-senha">{editando ? 'Nova senha' : 'Senha'}</label>
          <input
            id="u-senha"
            type="password"
            autoComplete="new-password"
            placeholder={editando ? 'Em branco mantém a atual' : undefined}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
      </div>
      {editando ? <p className="hint">O nome de usuário não muda depois de criado.</p> : null}
    </Modal>
  )
}
