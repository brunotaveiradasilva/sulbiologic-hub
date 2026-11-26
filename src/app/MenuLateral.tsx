import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { IconeCadastros, IconeCampanhas, IconeDados, IconeInicio, IconeMateriais, IconeMetas } from './IconesMenu'
import {
  SUBABAS_CAMPANHAS,
  SUBABAS_DADOS,
  SUBABAS_METAS,
  subabasCadastros,
  type SubabaCadastros,
  type SubabaMetas,
  type SubabaCampanhas,
  type SubabaDados,
} from './navegacao'

/** 'conta' (Minha conta) não aparece na lista do menu: abre pelo menu da foto, embaixo. */
export type AbaPrincipal = 'inicio' | 'materiais' | 'metas' | 'campanhas' | 'dados' | 'cadastros' | 'conta'

interface Props {
  aba: AbaPrincipal
  isAdmin: boolean
  consultaMetas: boolean
  veAlmoxarifado: boolean
  usuario: string
  /** Nome da pessoa (ou o login, se não tiver nome cadastrado). */
  nomeExibido: string
  avatar: string | null
  aoMudarAba: (aba: AbaPrincipal) => void
  subabaMetas: SubabaMetas
  aoMudarSubabaMetas: (subaba: SubabaMetas) => void
  subabaCampanhas: SubabaCampanhas
  aoMudarSubabaCampanhas: (subaba: SubabaCampanhas) => void
  subabaDados: SubabaDados
  aoMudarSubabaDados: (subaba: SubabaDados) => void
  subabaCadastros: SubabaCadastros
  aoMudarSubabaCadastros: (subaba: SubabaCadastros) => void
  aoAbrirUsuarios: () => void
  aoAbrirConta: () => void
  aoSair: () => void
}

/** Quantas seções cabem na barra de baixo do celular sem apertar os nomes (fora a conta/Mais). */
const MAX_NA_BARRA = 4

/** Menu vertical fixo à esquerda: navegação principal em cima, conta logada (com menu) no rodapé. */
export function MenuLateral({
  aba,
  isAdmin,
  consultaMetas,
  veAlmoxarifado,
  usuario,
  nomeExibido,
  avatar,
  aoMudarAba,
  subabaMetas,
  aoMudarSubabaMetas,
  subabaCampanhas,
  aoMudarSubabaCampanhas,
  subabaDados,
  aoMudarSubabaDados,
  subabaCadastros,
  aoMudarSubabaCadastros,
  aoAbrirUsuarios,
  aoAbrirConta,
  aoSair,
}: Props) {
  const [aberto, setAberto] = useState(false)
  // Seção cujos subitens foram escondidos — clicar de novo na seção que já está aberta recolhe.
  // Guarda qual seção (não um booleano) pra que ir pra outra, pelo menu ou pela página inicial, já abra.
  const [recolhidaEm, setRecolhidaEm] = useState<AbaPrincipal | null>(null)
  const recolhida = recolhidaEm === aba
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  /** Na seção atual, abre/recolhe os subitens; em outra, vai pra ela já aberta. */
  function clicarSecao(destino: AbaPrincipal) {
    if (destino === aba) {
      setRecolhidaEm((r) => (r === aba ? null : aba))
      return
    }
    setRecolhidaEm(null)
    aoMudarAba(destino)
  }

  const cadastros = subabasCadastros(isAdmin, veAlmoxarifado)
  const secoes = [
    { aba: 'inicio' as const, rotulo: 'Início', curto: 'Início', icone: <IconeInicio />, subitens: [] },
    ...(veAlmoxarifado
      ? [
          {
            aba: 'materiais' as const,
            rotulo: 'Materiais', curto: 'Agenda',
            icone: <IconeMateriais />,
            subitens: [],
          },
        ]
      : []),
    ...(consultaMetas
      ? [
          {
            aba: 'metas' as const,
            rotulo: 'Metas', curto: 'Metas',
            icone: <IconeMetas />,
            subitens: SUBABAS_METAS.map((s) => ({
              ...s,
              ativo: subabaMetas === s.valor,
              escolher: () => aoMudarSubabaMetas(s.valor),
            })),
          },
          {
            aba: 'campanhas' as const,
            rotulo: 'Campanhas', curto: 'Campanha',
            icone: <IconeCampanhas />,
            subitens: SUBABAS_CAMPANHAS.map((s) => ({
              ...s,
              ativo: subabaCampanhas === s.valor,
              escolher: () => aoMudarSubabaCampanhas(s.valor),
            })),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            aba: 'dados' as const,
            rotulo: 'Dados', curto: 'Dados',
            icone: <IconeDados />,
            subitens: SUBABAS_DADOS.map((s) => ({
              ...s,
              ativo: subabaDados === s.valor,
              escolher: () => aoMudarSubabaDados(s.valor),
            })),
          },
        ]
      : []),
    ...(cadastros.length
      ? [
          {
            aba: 'cadastros' as const,
            rotulo: 'Cadastros', curto: 'Cadastro',
            icone: <IconeCadastros />,
            subitens: cadastros.map((s) => ({
              ...s,
              ativo: subabaCadastros === s.valor,
              escolher: () => aoMudarSubabaCadastros(s.valor),
            })),
          },
        ]
      : []),
  ]

  // No celular a barra de baixo mostra no máximo 4 seções + a conta; o que sobrar (Dados e Cadastros
  // do admin) vai pra folha do "Mais", junto com Minha conta e Sair.
  const naBarra = secoes.length > MAX_NA_BARRA ? secoes.slice(0, MAX_NA_BARRA) : secoes
  const excedentes = secoes.slice(naBarra.length)
  const excedenteAtivo = excedentes.some((s) => s.aba === aba) || aba === 'conta'

  return (
    <aside className="menu-lateral" style={{ '--itens': naBarra.length } as CSSProperties}>
      <div className="menu-lateral-marca">
        <span className="marca-nome">SulBiologic</span>
        <span className="marca-faixa" aria-hidden="true" />
        <span className="marca-sub">Hub</span>
      </div>

      <nav className="menu-lateral-nav" aria-label="Navegação principal">
        {secoes.map((secao, i) => {
          const ativa = aba === secao.aba
          const aberta = ativa && !recolhida
          const temSubitens = secao.subitens.length > 0
          const excedente = i >= naBarra.length
          return (
            <Fragment key={secao.aba}>
              <button
                type="button"
                className={`menu-lateral-item${ativa ? ' is-ativo' : ''}${excedente ? ' so-desktop' : ''}`}
                aria-current={ativa ? 'page' : undefined}
                aria-expanded={ativa && temSubitens ? aberta : undefined}
                onClick={() => clicarSecao(secao.aba)}
              >
                {secao.icone}
                <span className="menu-lateral-rotulo">{secao.rotulo}</span>
                <span className="menu-lateral-rotulo-curto" aria-hidden="true">{secao.curto}</span>
                {temSubitens ? (
                  <span className={`menu-lateral-seta${aberta ? ' is-aberta' : ''}`} aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : null}
              </button>

              {/* Sempre montado (fechado fica inert) pra dar pra animar também o fechar. */}
              {temSubitens ? (
                <div className={`menu-lateral-sanfona${aberta ? ' is-aberta' : ''}`} inert={!aberta}>
                  <div className="menu-lateral-sanfona-conteudo">
                    <div className="menu-lateral-subitens">
                      {secao.subitens.map((s, i) => (
                        <button
                          key={s.valor}
                          type="button"
                          className={`menu-lateral-subitem${s.ativo ? ' is-ativo' : ''}`}
                          style={{ '--i': i } as CSSProperties}
                          aria-current={s.ativo ? 'page' : undefined}
                          onClick={s.escolher}
                        >
                          {s.rotulo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </Fragment>
          )
        })}
      </nav>

      <div className="menu-lateral-conta" ref={containerRef}>
        {aberto ? (
          <button type="button" className="menu-folha-fundo so-celular" aria-label="Fechar" tabIndex={-1} onClick={() => setAberto(false)} />
        ) : null}
        {aberto ? (
          <div className="menu-dropdown" role="menu">
            <span className="menu-folha-alca so-celular" aria-hidden="true" />
            <div className="menu-dropdown-usuario">
              {nomeExibido}
              {nomeExibido !== usuario ? <span className="usuario-login">{usuario}</span> : null}
            </div>
            {excedentes.length ? (
              <div className="menu-folha-secoes so-celular">
                {excedentes.map((secao) => (
                  <button
                    key={secao.aba}
                    type="button"
                    role="menuitem"
                    className={aba === secao.aba ? 'is-ativo' : undefined}
                    aria-current={aba === secao.aba ? 'page' : undefined}
                    onClick={() => {
                      setAberto(false)
                      if (secao.aba !== aba) aoMudarAba(secao.aba)
                    }}
                  >
                    {secao.icone}
                    {secao.rotulo}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false)
                aoAbrirConta()
              }}
            >
              Minha conta
            </button>
            {isAdmin ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAberto(false)
                  aoAbrirUsuarios()
                }}
              >
                Usuários
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="menu-dropdown-sair"
              onClick={() => {
                setAberto(false)
                aoSair()
              }}
            >
              Sair
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className={`menu-lateral-rodape${aberto ? ' is-ativo' : ''}${excedenteAtivo ? ' is-atual' : ''}`}
          onClick={() => setAberto((a) => !a)}
          aria-label={excedentes.length ? 'Mais opções e conta' : 'Menu do usuário'}
          aria-expanded={aberto}
        >
          <span className="avatar-btn" aria-hidden="true">
            {avatar ? <img src={avatar} alt="" /> : <span>{nomeExibido.charAt(0).toUpperCase()}</span>}
          </span>
          <span className="menu-lateral-usuario">{nomeExibido}</span>
          <span className="menu-lateral-rotulo-curto" aria-hidden="true">{excedentes.length ? 'Mais' : 'Conta'}</span>
        </button>
      </div>
    </aside>
  )
}
