import type { ReactNode } from 'react'
import { IconeCampanhas, IconeDados, IconeMateriais, IconeMetas } from './IconesMenu'
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
import type { Resumo } from '../types'

/** Para onde um atalho da página inicial leva: a seção do menu e a subaba dela. */
export type Destino =
  | { aba: 'materiais'; subaba: SubabaMateriais }
  | { aba: 'metas'; subaba: SubabaMetas }
  | { aba: 'campanhas'; subaba: SubabaCampanhas }
  | { aba: 'dados'; subaba: SubabaDados }

interface Props {
  usuario: string
  isAdmin: boolean
  consultaMetas: boolean
  resumo: Resumo
  aoAbrir: (destino: Destino) => void
}

interface Cartao {
  chave: Destino['aba']
  titulo: string
  descricao: string
  icone: ReactNode
  atalhos: { rotulo: string; destino: Destino }[]
}

function saudacao(hora = new Date().getHours()) {
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Tela de entrada: um cartão por seção do menu lateral, com atalho direto pra cada subaba. */
export function PaginaInicial({ usuario, isAdmin, consultaMetas, resumo, aoAbrir }: Props) {
  const cartoes: Cartao[] = [
    {
      chave: 'materiais',
      titulo: 'Materiais',
      descricao: 'Retiradas e devoluções do almoxarifado, com o cadastro do que existe em estoque.',
      icone: <IconeMateriais />,
      atalhos: SUBABAS_MATERIAIS.map((s) => ({ rotulo: s.rotulo, destino: { aba: 'materiais', subaba: s.valor } })),
    },
    ...(consultaMetas
      ? ([
          {
            chave: 'metas',
            titulo: 'Metas',
            descricao: isAdmin
              ? 'Fornecedores, representantes e as metas de cada um, com o acompanhamento do mês.'
              : 'As metas do mês e quanto já foi realizado.',
            icone: <IconeMetas />,
            atalhos: subabasMetas(isAdmin).map((s) => ({ rotulo: s.rotulo, destino: { aba: 'metas', subaba: s.valor } })),
          },
          {
            chave: 'campanhas',
            titulo: 'Campanhas',
            descricao: 'Resultados das campanhas de incentivo em andamento.',
            icone: <IconeCampanhas />,
            atalhos: SUBABAS_CAMPANHAS.map((s) => ({
              rotulo: s.rotulo,
              destino: { aba: 'campanhas', subaba: s.valor },
            })),
          },
        ] satisfies Cartao[])
      : []),
    ...(isAdmin
      ? ([
          {
            chave: 'dados',
            titulo: 'Dados',
            descricao: 'Relatórios e comparativos a partir das vendas importadas.',
            icone: <IconeDados />,
            atalhos: SUBABAS_DADOS.map((s) => ({ rotulo: s.rotulo, destino: { aba: 'dados', subaba: s.valor } })),
          },
        ] satisfies Cartao[])
      : []),
  ]

  const pendencias = [
    resumo.atrasados ? `${resumo.atrasados} atrasado(s)` : null,
    resumo.retiradasHoje ? `${resumo.retiradasHoje} retirada(s) hoje` : null,
    resumo.devolucoesHoje ? `${resumo.devolucoesHoje} devolução(ões) hoje` : null,
  ].filter(Boolean)

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h2>
            {saudacao()}, {usuario}
          </h2>
          <p>Escolha por onde começar. Tudo o que está no menu ao lado também está aqui.</p>
        </div>
      </div>

      <div className="inicio-grid">
        {cartoes.map((c) => (
          <article key={c.chave} className="inicio-card">
            <button type="button" className="inicio-card-topo" onClick={() => aoAbrir(c.atalhos[0].destino)}>
              <span className="inicio-card-icone">{c.icone}</span>
              <h3>{c.titulo}</h3>
            </button>
            <p className="inicio-card-descricao">{c.descricao}</p>
            {c.chave === 'materiais' && pendencias.length ? (
              <p className={`inicio-card-alerta${resumo.atrasados ? ' is-atrasado' : ''}`}>{pendencias.join(' · ')}</p>
            ) : null}
            <div className="inicio-card-atalhos">
              {c.atalhos.map((a) => (
                <button key={a.rotulo} type="button" className="btn btn-sm" onClick={() => aoAbrir(a.destino)}>
                  {a.rotulo}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
