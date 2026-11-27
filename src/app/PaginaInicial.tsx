import type { ReactNode } from 'react'
import { IconeCadastros, IconeCampanhas, IconeDados, IconeMateriais, IconeMetas } from './IconesMenu'
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
import { URL_RETIRA } from './retira'

/** Para onde um atalho da página inicial leva: a seção do menu e a subaba dela. */
export type Destino =
  | { aba: 'metas'; subaba: SubabaMetas }
  | { aba: 'campanhas'; subaba: SubabaCampanhas }
  | { aba: 'dados'; subaba: SubabaDados }
  | { aba: 'cadastros'; subaba: SubabaCadastros }

interface Props {
  /** Nome da pessoa (ou o login, se não tiver nome cadastrado). */
  nome: string
  isAdmin: boolean
  consultaMetas: boolean
  veAlmoxarifado: boolean
  aoAbrir: (destino: Destino) => void
}

interface Cartao {
  chave: Destino['aba'] | 'retira'
  titulo: string
  descricao: string
  icone: ReactNode
  /** Cartão que leva pra fora do hub: abre este endereço numa aba nova, em vez dos atalhos. */
  href?: string
  atalhos: { rotulo: string; destino: Destino }[]
}

function saudacao(hora = new Date().getHours()) {
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Tela de entrada: um cartão por seção do menu lateral, com atalho direto pra cada subaba. */
export function PaginaInicial({ nome, isAdmin, consultaMetas, veAlmoxarifado, aoAbrir }: Props) {
  const cadastros = subabasCadastros(isAdmin)
  const cartoes: Cartao[] = [
    ...(veAlmoxarifado
      ? ([
          {
            chave: 'retira',
            titulo: 'Materiais',
            descricao: 'O almoxarifado agora fica no Retira: materiais, retiradas e devoluções. Abre numa aba nova.',
            icone: <IconeMateriais />,
            href: URL_RETIRA,
            atalhos: [],
          },
        ] satisfies Cartao[])
      : []),
    ...(consultaMetas
      ? ([
          {
            chave: 'metas',
            titulo: 'Metas',
            descricao: 'As metas do mês e quanto já foi realizado, por representante e por fornecedor.',
            icone: <IconeMetas />,
            atalhos: SUBABAS_METAS.map((s) => ({ rotulo: s.rotulo, destino: { aba: 'metas', subaba: s.valor } })),
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
    ...(cadastros.length
      ? ([
          {
            chave: 'cadastros',
            titulo: 'Cadastros',
            descricao: 'Tudo o que se cadastra no sistema, num lugar só: fornecedores, representantes, metas e usuários.',
            icone: <IconeCadastros />,
            atalhos: cadastros.map((s) => ({ rotulo: s.rotulo, destino: { aba: 'cadastros', subaba: s.valor } })),
          },
        ] satisfies Cartao[])
      : []),
  ]

  return (
    <section className="view">
      <div className="view-head">
        <div>
          <h2>
            {saudacao()}, {nome}
          </h2>
          <p>Escolha por onde começar. Tudo o que está no menu também está aqui.</p>
        </div>
      </div>

      <div className="inicio-grid">
        {cartoes.map((c) => (
          <article key={c.chave} className="inicio-card">
            {c.href ? (
              <a className="inicio-card-topo" href={c.href} target="_blank" rel="noopener">
                <span className="inicio-card-icone">{c.icone}</span>
                <h3>{c.titulo}</h3>
              </a>
            ) : (
              <button type="button" className="inicio-card-topo" onClick={() => aoAbrir(c.atalhos[0].destino)}>
                <span className="inicio-card-icone">{c.icone}</span>
                <h3>{c.titulo}</h3>
              </button>
            )}
            <p className="inicio-card-descricao">{c.descricao}</p>
            <div className="inicio-card-atalhos">
              {c.href ? (
                <a className="btn btn-sm" href={c.href} target="_blank" rel="noopener">
                  Abrir o Retira ↗
                </a>
              ) : (
                c.atalhos.map((a) => (
                  <button key={a.rotulo} type="button" className="btn btn-sm" onClick={() => aoAbrir(a.destino)}>
                    {a.rotulo}
                  </button>
                ))
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
