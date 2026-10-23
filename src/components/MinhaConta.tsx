import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { redimensionarAvatar } from '../lib/avatar'
import { eu, trocarSenha, ErroApi } from '../lib/api'
import { formatarData, hoje } from '../lib/datas'
import { PERFIS } from '../lib/perfis'
import { DialogoConfirmar, DialogoSucesso } from './DialogoConfirmar'
import { EstadoVazio } from './EstadoVazio'
import type { MeuLogin, MeusDados } from '../types'

interface Props {
  avatar: string | null
  aoTrocarFoto: (avatar: string | null) => Promise<void>
  aoSalvarDados: (dados: MeusDados) => Promise<MeuLogin>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Uma linha do "o que vai mudar" do diálogo de confirmação. */
interface Mudanca {
  campo: string
  de: string
  para: string
}

function mensagemErro(e: unknown, padrao: string): string {
  return e instanceof ErroApi ? e.message : padrao
}

function dadosDe(login: MeuLogin): MeusDados {
  return {
    nome: login.nome ?? '',
    sobrenome: login.sobrenome ?? '',
    email: login.email ?? '',
    celular: login.celular ?? '',
    dataNascimento: login.dataNascimento ?? null,
  }
}

/**
 * Página Minha conta: foto, dados da pessoa e senha de quem está logado. Cada gravação passa por um
 * "tem certeza?" com o que vai mudar e termina num aviso de sucesso. Login e perfil só o admin muda.
 */
export function MinhaConta({ avatar, aoTrocarFoto, aoSalvarDados }: Props) {
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const [login, setLogin] = useState<MeuLogin | null>(null)
  const [erroCarga, setErroCarga] = useState('')

  // Formulário de dados (a foto entra junto: escolhida aqui, gravada no "Salvar alterações").
  const [dados, setDados] = useState<MeusDados>({ nome: '', sobrenome: '', email: '', celular: '', dataNascimento: null })
  const [fotoNova, setFotoNova] = useState<string | null | undefined>(undefined)
  const [erroDados, setErroDados] = useState('')

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')

  const [confirmando, setConfirmando] = useState<'dados' | 'senha' | null>(null)
  const [sucesso, setSucesso] = useState<'dados' | 'senha' | null>(null)

  useEffect(() => {
    eu()
      .then((atual) => {
        setLogin(atual)
        setDados(dadosDe(atual))
      })
      .catch((e) => setErroCarga(mensagemErro(e, 'Não foi possível carregar os seus dados.')))
  }, [])

  const fotoNaTela = fotoNova === undefined ? avatar : fotoNova
  const original = login ? dadosDe(login) : null

  function mudancas(): Mudanca[] {
    if (!original) return []
    const lista: Mudanca[] = []
    const campos: { chave: keyof MeusDados; rotulo: string }[] = [
      { chave: 'nome', rotulo: 'Nome' },
      { chave: 'sobrenome', rotulo: 'Sobrenome' },
      { chave: 'email', rotulo: 'E-mail' },
      { chave: 'celular', rotulo: 'Celular' },
      { chave: 'dataNascimento', rotulo: 'Nascimento' },
    ]
    for (const { chave, rotulo } of campos) {
      const de = (original[chave] ?? '').trim()
      const para = (dados[chave] ?? '').trim()
      if (de === para) continue
      const formatar = (v: string) => (v ? (chave === 'dataNascimento' ? formatarData(v) : v) : '(vazio)')
      lista.push({ campo: rotulo, de: formatar(de), para: formatar(para) })
    }
    if (fotoNova !== undefined && fotoNova !== avatar) {
      lista.push({ campo: 'Foto', de: avatar ? 'atual' : '(sem foto)', para: fotoNova ? 'nova foto' : '(sem foto)' })
    }
    return lista
  }

  const alteracoes = mudancas()

  async function aoEscolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    setErroDados('')
    try {
      setFotoNova(await redimensionarAvatar(arquivo))
    } catch {
      setErroDados('Não foi possível usar essa imagem. Tente outra.')
    }
  }

  function pedirParaSalvarDados(e: FormEvent) {
    e.preventDefault()
    if (!dados.nome.trim()) return setErroDados('Informe o nome.')
    if (dados.email.trim() && !EMAIL.test(dados.email.trim())) return setErroDados('Esse e-mail não parece válido.')
    if (dados.dataNascimento && dados.dataNascimento >= hoje()) {
      return setErroDados('A data de nascimento precisa ser no passado.')
    }
    if (!alteracoes.length) return setErroDados('Nada mudou ainda.')
    setErroDados('')
    setConfirmando('dados')
  }

  async function salvarDados() {
    const dadosMudaram = alteracoes.some((m) => m.campo !== 'Foto')
    try {
      if (fotoNova !== undefined && fotoNova !== avatar) await aoTrocarFoto(fotoNova)
      if (dadosMudaram) {
        const atual = await aoSalvarDados({
          ...dados,
          nome: dados.nome.trim(),
          sobrenome: dados.sobrenome.trim(),
          email: dados.email.trim(),
          celular: dados.celular.trim(),
        })
        setLogin(atual)
        setDados(dadosDe(atual))
      }
    } catch (e) {
      throw new Error(mensagemErro(e, 'Não foi possível salvar os seus dados.'))
    }
    setFotoNova(undefined)
    setConfirmando(null)
    setSucesso('dados')
  }

  function descartar() {
    if (original) setDados(original)
    setFotoNova(undefined)
    setErroDados('')
  }

  function pedirParaTrocarSenha(e: FormEvent) {
    e.preventDefault()
    if (!senhaAtual) return setErroSenha('Informe a senha atual.')
    if (novaSenha.length < 4) return setErroSenha('A nova senha precisa ter pelo menos 4 caracteres.')
    if (novaSenha !== confirmarSenha) return setErroSenha('As senhas não coincidem.')
    if (novaSenha === senhaAtual) return setErroSenha('A nova senha é igual à atual.')
    setErroSenha('')
    setConfirmando('senha')
  }

  async function salvarSenha() {
    try {
      await trocarSenha(senhaAtual, novaSenha)
    } catch (e) {
      throw new Error(mensagemErro(e, 'Não foi possível trocar a senha.'))
    }
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setConfirmando(null)
    setSucesso('senha')
  }

  function campo(chave: keyof MeusDados, valor: string) {
    setDados((d) => ({ ...d, [chave]: chave === 'dataNascimento' ? valor || null : valor }))
  }

  if (!login) {
    return (
      <section className="view" role="tabpanel">
        {erroCarga ? (
          <EstadoVazio titulo="Não deu pra carregar" texto={erroCarga} />
        ) : (
          <EstadoVazio titulo="Carregando…" texto="Buscando os seus dados." />
        )}
      </section>
    )
  }

  const perfil = PERFIS.find((p) => p.valor === login.role)
  const inicial = (dados.nome || login.usuario).charAt(0).toUpperCase()

  return (
    <section className="view" role="tabpanel">
      <div className="view-head">
        <div>
          <h2>Minha conta</h2>
          <p>Seus dados, sua foto e sua senha.</p>
        </div>
      </div>

      <div className="conta-pagina">
        <form className="conta-secao" onSubmit={pedirParaSalvarDados}>
          <h3>Dados pessoais</h3>

          <div className="conta-perfil">
            <span className="conta-avatar" aria-hidden="true">
              {fotoNaTela ? <img src={fotoNaTela} alt="" /> : <span>{inicial}</span>}
            </span>
            <div className="conta-perfil-acoes">
              <button type="button" className="btn btn-sm" onClick={() => inputFotoRef.current?.click()}>
                {fotoNaTela ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              {fotoNaTela ? (
                <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => setFotoNova(null)}>
                  Remover foto
                </button>
              ) : null}
            </div>
            <input ref={inputFotoRef} type="file" accept="image/*" hidden onChange={aoEscolherFoto} />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="mc-nome">Nome</label>
              <input id="mc-nome" maxLength={80} value={dados.nome} onChange={(e) => campo('nome', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="mc-sobrenome">Sobrenome</label>
              <input
                id="mc-sobrenome"
                maxLength={80}
                value={dados.sobrenome}
                onChange={(e) => campo('sobrenome', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="mc-email">E-mail</label>
              <input
                id="mc-email"
                type="email"
                maxLength={120}
                placeholder="Opcional"
                value={dados.email}
                onChange={(e) => campo('email', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mc-celular">Celular / WhatsApp</label>
              <input
                id="mc-celular"
                type="tel"
                maxLength={20}
                placeholder="Opcional"
                value={dados.celular}
                onChange={(e) => campo('celular', e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="mc-nascimento">Data de nascimento</label>
              <input
                id="mc-nascimento"
                type="date"
                max={hoje()}
                value={dados.dataNascimento ?? ''}
                onChange={(e) => campo('dataNascimento', e.target.value)}
              />
            </div>
          </div>

          <div className="conta-secao-rodape">
            {erroDados ? <span className="msg">{erroDados}</span> : null}
            {alteracoes.length ? (
              <button type="button" className="btn btn-ghost" onClick={descartar}>
                Descartar
              </button>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={!alteracoes.length}>
              Salvar alterações
            </button>
          </div>
        </form>

        <div className="conta-lateral">
          <section className="conta-secao">
            <h3>Acesso</h3>
            <dl className="conta-acesso">
              <dt>Usuário</dt>
              <dd>{login.usuario}</dd>
              <dt>Perfil</dt>
              <dd>{perfil?.rotulo ?? login.role}</dd>
              {login.representanteNome ? (
                <>
                  <dt>Representante</dt>
                  <dd>{login.representanteNome}</dd>
                </>
              ) : null}
            </dl>
            <p className="hint">Usuário e perfil só o administrador muda.</p>
          </section>

          <form className="conta-secao" onSubmit={pedirParaTrocarSenha}>
            <h3>Trocar senha</h3>
            <div className="field">
              <label htmlFor="mc-atual">Senha atual</label>
              <input
                id="mc-atual"
                type="password"
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mc-nova">Nova senha</label>
              <input
                id="mc-nova"
                type="password"
                autoComplete="new-password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mc-confirma">Confirmar nova senha</label>
              <input
                id="mc-confirma"
                type="password"
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>
            <div className="conta-secao-rodape">
              {erroSenha ? <span className="msg">{erroSenha}</span> : null}
              <button type="submit" className="btn btn-primary">
                Trocar senha
              </button>
            </div>
          </form>
        </div>
      </div>

      {confirmando === 'dados' ? (
        <DialogoConfirmar
          titulo="Salvar alterações?"
          textoConfirmar="Sim, salvar"
          aoConfirmar={salvarDados}
          aoFechar={() => setConfirmando(null)}
        >
          <p>Confira o que vai mudar na sua conta:</p>
          <ul className="conta-mudancas">
            {alteracoes.map((m) => (
              <li key={m.campo}>
                <strong>{m.campo}:</strong> <span className="hint">{m.de}</span> → {m.para}
              </li>
            ))}
          </ul>
        </DialogoConfirmar>
      ) : null}

      {confirmando === 'senha' ? (
        <DialogoConfirmar
          titulo="Trocar sua senha?"
          textoConfirmar="Sim, trocar"
          aoConfirmar={salvarSenha}
          aoFechar={() => setConfirmando(null)}
        >
          <p>A senha atual para de funcionar e, no próximo login, você entra com a nova.</p>
        </DialogoConfirmar>
      ) : null}

      {sucesso === 'dados' ? (
        <DialogoSucesso titulo="Dados salvos" aoFechar={() => setSucesso(null)}>
          <p>Suas alterações foram salvas.</p>
        </DialogoSucesso>
      ) : null}

      {sucesso === 'senha' ? (
        <DialogoSucesso titulo="Senha trocada" aoFechar={() => setSucesso(null)}>
          <p>Pronto! Use a nova senha da próxima vez que entrar.</p>
        </DialogoSucesso>
      ) : null}
    </section>
  )
}
