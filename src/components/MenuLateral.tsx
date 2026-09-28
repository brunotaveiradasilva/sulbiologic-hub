import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { IconeCampanhas, IconeDados, IconeInicio, IconeMateriais, IconeMetas, IconeUsuarios } from './IconesMenu'
import {
  SUBABAS_CAMPANHAS,
  SUBABAS_DADOS,
  SUBABAS_MATERIAIS,
  subabasMetas,
  type SubabaMetas,
  type SubabaCampanhas,
  type SubabaDados,
  type SubabaMateriais,
} from '../lib/navegacao'

export type AbaPrincipal = 'inicio' | 'materiais' | 'metas' | 'campanhas' | 'dados' | 'usuarios'

interface Props {
  aba: AbaPrincipal
  isAdmin: boolean
  consultaMetas: boolean
  usuario: string
  avatar: string | null
  aoMudarAba: (aba: AbaPrincipal) => void
  subabaMateriais: SubabaMateriais
  aoMudarSubabaMateriais: (subaba: SubabaMateriais) => void
  subabaMetas: SubabaMetas
  aoMudarSubabaMetas: (subaba: SubabaMetas) => void
  subabaCampanhas: SubabaCampanhas
  aoMudarSubabaCampanhas: (subaba: SubabaCampanhas) => void
  subabaDados: SubabaDados
  aoMudarSubabaDados: (subaba: SubabaDados) => void
  aoAbrirUsuarios: () => void
  aoAbrirConta: () => void
  aoSair: () => void
}

/** Menu vertical fixo à esquerda: navegação principal em cima, conta logada (com menu) no rodapé. */
export function MenuLateral({
  aba,
  isAdmin,
  consultaMetas,
  usuario,
  avatar,
  aoMudarAba,
  subabaMateriais,
  aoMudarSubabaMateriais,
  subabaMetas,
  aoMudarSubabaMetas,
  subabaCampanhas,
  aoMudarSubabaCampanhas,
  subabaDados,
  aoMudarSubabaDados,
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

  const secoes = [
    { aba: 'inicio' as const, rotulo: 'Início', icone: <IconeInicio />, subitens: [] },
    {
      aba: 'materiais' as const,
      rotulo: 'Materiais',
      icone: <IconeMateriais />,
      subitens: SUBABAS_MATERIAIS.map((s) => ({
        ...s,
        ativo: subabaMateriais === s.valor,
        escolher: () => aoMudarSubabaMateriais(s.valor),
      })),
    },
    ...(consultaMetas
      ? [
          {
            aba: 'metas' as const,
            rotulo: 'Metas',
            icone: <IconeMetas />,
            subitens: subabasMetas(isAdmin).map((s) => ({
              ...s,
              ativo: subabaMetas === s.valor,
              escolher: () => aoMudarSubabaMetas(s.valor),
            })),
          },
          {
            aba: 'campanhas' as const,
            rotulo: 'Campanhas',
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
            rotulo: 'Dados',
            icone: <IconeDados />,
            subitens: SUBABAS_DADOS.map((s) => ({
              ...s,
              ativo: subabaDados === s.valor,
              escolher: () => aoMudarSubabaDados(s.valor),
            })),
          },
          { aba: 'usuarios' as const, rotulo: 'Usuários', icone: <IconeUsuarios />, subitens: [] },
        ]
      : []),
  ]

  return (
    <aside className="menu-lateral">
      <div className="menu-lateral-marca">SulBiologic Hub</div>

      <nav className="menu-lateral-nav" aria-label="Navegação principal">
        {secoes.map((secao) => {
          const ativa = aba === secao.aba
          const aberta = ativa && !recolhida
          const temSubitens = secao.subitens.length > 0
          return (
            <Fragment key={secao.aba}>
              <button
                type="button"
                className={`menu-lateral-item${ativa ? ' is-ativo' : ''}`}
                aria-current={ativa ? 'page' : undefined}
                aria-expanded={ativa && temSubitens ? aberta : undefined}
                onClick={() => clicarSecao(secao.aba)}
              >
                {secao.icone}
                <span>{secao.rotulo}</span>
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
          <div className="menu-dropdown" role="menu">
            <div className="menu-dropdown-usuario">{usuario}</div>
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
          className={`menu-lateral-rodape${aberto ? ' is-ativo' : ''}`}
          onClick={() => setAberto((a) => !a)}
          aria-label="Menu do usuário"
          aria-expanded={aberto}
        >
          <span className="avatar-btn" aria-hidden="true">
            {avatar ? <img src={avatar} alt="" /> : <span>{usuario.charAt(0).toUpperCase()}</span>}
          </span>
          <span className="menu-lateral-usuario">{usuario}</span>
        </button>
      </div>
    </aside>
  )
}
