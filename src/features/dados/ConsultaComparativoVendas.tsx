import { useMemo, useState, type FormEvent } from 'react'
import { EstadoVazio } from '../../shared/components/EstadoVazio'
import { CarregandoTelaInteira } from '../../shared/components/CarregandoTelaInteira'
import { SeletorMultiplo } from '../../shared/components/SeletorMultiplo'
import { useComparativoVendas, type ConsultaVendas } from './useComparativoVendas'
import {
  METRICAS,
  TIPOS_COMPARACAO,
  UNIDADE_DA_METRICA,
  erroDoPeriodo,
  mesesDoFiltro,
  periodosDaComparacao,
  rotuloPeriodo,
  variacao,
  type Metrica,
  type Periodo,
  type TipoComparacao,
} from './comparativo'
import { mesAtual, rotuloMesCurto } from '../../shared/lib/mes'
import { representantesComCodigoAds } from '../../shared/lib/representantes'
import { formatarValorMeta } from '../../shared/lib/unidadeMeta'
import type { ValoresVenda } from '../../types'

const ZERO: ValoresVenda = { valor: 0, kg: 0, clientes: 0 }

interface Linha {
  representanteId: string
  nome: string
  atual: ValoresVenda
  anterior: ValoresVenda
}

function mesmaConsulta(a: ConsultaVendas, b: ConsultaVendas): boolean {
  return (
    a.atual.inicio === b.atual.inicio &&
    a.atual.fim === b.atual.fim &&
    a.anterior.inicio === b.anterior.inicio &&
    a.anterior.fim === b.anterior.fim &&
    mesmosIds(a.representanteIds, b.representanteIds) &&
    mesmosIds(a.fornecedorIds, b.fornecedorIds)
  )
}

/** Mesma escolha, em qualquer ordem de clique. */
function mesmosIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id))
}

/**
 * Aba Dados: quanto cada representante do cadastro vendeu num período comparado com outro — mês
 * contra o mesmo mês do ano passado, contra o mês anterior, acumulado do ano ou dois períodos
 * livres. Os números vêm direto da ADS (não do que foi sincronizado nas metas), então vale pra
 * qualquer mês passado. A ADS é lenta: só busca ao clicar em Buscar, nunca sozinha.
 */
export function ConsultaComparativoVendas() {
  const [tipo, setTipo] = useState<TipoComparacao>('mesAnoAnterior')
  const [mes, setMes] = useState(mesAtual)
  const [mesmoDia, setMesmoDia] = useState(true)
  // Preenchidos com os períodos da comparação que estava escolhida quando a pessoa passa pra "Períodos livres".
  const [livreAtual, setLivreAtual] = useState<Periodo>({ inicio: '', fim: '' })
  const [livreAnterior, setLivreAnterior] = useState<Periodo>({ inicio: '', fim: '' })
  // Vazio = todos.
  const [representanteIds, setRepresentanteIds] = useState<string[]>([])
  const [fornecedorIds, setFornecedorIds] = useState<string[]>([])
  const [metrica, setMetrica] = useState<Metrica>('valor')

  const periodos = useMemo(
    () =>
      tipo === 'personalizado'
        ? { atual: livreAtual, anterior: livreAnterior }
        : periodosDaComparacao(tipo, mes, mesmoDia),
    [tipo, mes, mesmoDia, livreAtual, livreAnterior],
  )
  const consulta: ConsultaVendas = { ...periodos, representanteIds, fornecedorIds }
  const erroPeriodo = erroDoPeriodo(periodos.atual) ?? erroDoPeriodo(periodos.anterior)

  const comp = useComparativoVendas()
  const resultado = comp.resultado
  const meses = useMemo(() => mesesDoFiltro(), [])
  const filtrosMudaram = resultado !== null && !mesmaConsulta(resultado.consulta, consulta)

  /** Cada representante buscado, casado entre os dois períodos pelo id do cadastro. Sem venda em nenhum dos dois, some. */
  const linhas = useMemo<Linha[]>(() => {
    if (!resultado) return []
    const anterior = new Map(resultado.anterior.representantes.map((r) => [r.representanteId, r.valores]))
    return resultado.atual.representantes
      .map((r) => ({ representanteId: r.representanteId, nome: r.nome, atual: r.valores, anterior: anterior.get(r.representanteId) ?? ZERO }))
      .filter((l) => l.atual.valor || l.anterior.valor || l.atual.kg || l.anterior.kg)
      .sort(
        (a, b) =>
          b.atual[metrica] - a.atual[metrica] || b.anterior[metrica] - a.anterior[metrica] || a.nome.localeCompare(b.nome, 'pt-BR'),
      )
  }, [resultado, metrica])

  // Clientes do total vêm prontos da API: somar os de cada representante contaria duas vezes quem compra de dois.
  const resumo = { atual: resultado?.atual.total ?? ZERO, anterior: resultado?.anterior.total ?? ZERO }

  const unidade = UNIDADE_DA_METRICA[metrica]
  // Rótulos do que foi buscado, não do que está nos filtros agora (podem ter mudado sem buscar de novo).
  const rotuloAtual = resultado ? rotuloPeriodo(resultado.consulta.atual) : ''
  const rotuloAnterior = resultado ? rotuloPeriodo(resultado.consulta.anterior) : ''
  const buscouUmSo = resultado !== null && resultado.consulta.representanteIds.length === 1
  const mesEmAndamento = tipo !== 'personalizado' && mes === mesAtual()

  function mudarTipo(novo: TipoComparacao) {
    if (novo === 'personalizado' && tipo !== 'personalizado') {
      setLivreAtual(periodos.atual)
      setLivreAnterior(periodos.anterior)
    }
    setTipo(novo)
  }

  function buscar(e: FormEvent) {
    e.preventDefault()
    if (erroPeriodo || comp.carregando) return
    comp.buscar(consulta)
  }

  return (
    <div className={comp.carregando ? 'comparativo is-carregando' : 'comparativo'}>
      {/* Trava a tela enquanto busca, pra ninguém mexer nos filtros no meio da consulta. */}
      {comp.carregando ? <CarregandoTelaInteira texto="Buscando as vendas na ADS… pode levar alguns segundos." /> : null}

      {comp.erro ? (
        <div className="banner-erro" role="alert">
          <span>{comp.erro}</span>
        </div>
      ) : null}

      <form onSubmit={buscar}>
        <div className="consulta-filtros">
          <div className="field consulta-filtro">
            <label htmlFor="dados-tipo">Comparação</label>
            <select id="dados-tipo" value={tipo} onChange={(e) => mudarTipo(e.target.value as TipoComparacao)}>
              {TIPOS_COMPARACAO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </div>

          {tipo !== 'personalizado' ? (
            <div className="field consulta-filtro consulta-filtro-mes">
              <label htmlFor="dados-mes">{tipo === 'acumuladoAno' ? 'Até o mês' : 'Mês'}</label>
              <select id="dados-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {rotuloMesCurto(m)}
                    {m === mesAtual() ? ' (atual)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <IntervaloDatas id="dados-atual" rotulo="Período" periodo={livreAtual} aoMudar={setLivreAtual} />
              <IntervaloDatas id="dados-anterior" rotulo="Comparar com" periodo={livreAnterior} aoMudar={setLivreAnterior} />
            </>
          )}

          {mesEmAndamento ? (
            <label className="comparativo-check">
              <input type="checkbox" checked={mesmoDia} onChange={(e) => setMesmoDia(e.target.checked)} />
              Comparar até o mesmo dia
            </label>
          ) : null}
        </div>

        <div className="consulta-filtros">
          <SeletorMultiplo
            id="dados-representante"
            rotulo="Representante"
            opcoes={representantesComCodigoAds(comp.representantes).map((r) => ({ valor: r.id, rotulo: r.nome }))}
            selecionados={representanteIds}
            aoMudar={setRepresentanteIds}
            textoTodos="Todos os representantes"
            nomePlural="representantes"
          />
          <SeletorMultiplo
            id="dados-fornecedor"
            rotulo="Fornecedor"
            opcoes={comp.fornecedores.map((f) => ({ valor: f.id, rotulo: f.nome }))}
            selecionados={fornecedorIds}
            aoMudar={setFornecedorIds}
            textoTodos="Todos os fornecedores"
            nomePlural="fornecedores"
          />
          <div className="consulta-acoes">
            <button type="submit" className="btn btn-primary" disabled={!!erroPeriodo || comp.carregando}>
              {comp.carregando ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </div>
      </form>

      {erroPeriodo ? (
        <p className="hint warn comparativo-aviso">{erroPeriodo}</p>
      ) : filtrosMudaram && !comp.carregando ? (
        <p className="hint comparativo-aviso">Os filtros mudaram — clique em Buscar pra atualizar os números.</p>
      ) : null}

      {!resultado ? (
        comp.carregando ? (
          <EstadoVazio titulo="Buscando na ADS…" texto="Somando as vendas dos dois períodos. Um ano inteiro pode levar alguns segundos." />
        ) : (
          <EstadoVazio
            titulo="Escolha os filtros e clique em Buscar"
            texto="As vendas vêm direto da ADS, dos representantes cadastrados com código ADS. Escolher um representante só deixa a busca bem mais rápida."
          />
        )
      ) : (
        <>
          <div className="comparativo-metrica" role="group" aria-label="Métrica">
            <div className="filters">
              {METRICAS.map((m) => (
                <button key={m.valor} type="button" aria-pressed={metrica === m.valor} onClick={() => setMetrica(m.valor)}>
                  {m.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="stats meta-kpis meta-kpis-largo">
            <div className="stat">
              <span className="label">{rotuloAtual}</span>
              <span className="value">{formatarValorMeta(resumo.atual[metrica], unidade)}</span>
            </div>
            <div className="stat">
              <span className="label">{rotuloAnterior}</span>
              <span className="value">{formatarValorMeta(resumo.anterior[metrica], unidade)}</span>
            </div>
            <div className="stat">
              <span className="label">Variação</span>
              <span className="value">
                <Variacao atual={resumo.atual[metrica]} anterior={resumo.anterior[metrica]} />
              </span>
              <span className="note">{diferenca(resumo.atual[metrica], resumo.anterior[metrica], unidade)}</span>
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-card-head">
              <h3>{buscouUmSo ? (resultado.atual.representantes[0]?.nome ?? 'Representante') : 'Por representante'}</h3>
              <span className="meta-badge">{comp.carregando ? 'Atualizando…' : `${rotuloAtual} × ${rotuloAnterior}`}</span>
            </div>
            {linhas.length ? (
              <div className="table-scroll">
                <div className="table-wrap">
                  <table className="tabela-comparativo">
                    <thead>
                      <tr>
                        <th>Representante</th>
                        <th className="num">{rotuloAnterior}</th>
                        <th className="num">{rotuloAtual}</th>
                        <th className="num">Diferença</th>
                        <th className="num">Variação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.representanteId}>
                          <td className="cell-material">{l.nome}</td>
                          <td className="num">{formatarValorMeta(l.anterior[metrica], unidade)}</td>
                          <td className="num">{formatarValorMeta(l.atual[metrica], unidade)}</td>
                          <td className="num">{diferenca(l.atual[metrica], l.anterior[metrica], unidade)}</td>
                          <td className="num">
                            <Variacao atual={l.atual[metrica]} anterior={l.anterior[metrica]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {linhas.length > 1 ? (
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td className="num">{formatarValorMeta(resumo.anterior[metrica], unidade)}</td>
                          <td className="num">{formatarValorMeta(resumo.atual[metrica], unidade)}</td>
                          <td className="num">{diferenca(resumo.atual[metrica], resumo.anterior[metrica], unidade)}</td>
                          <td className="num">
                            <Variacao atual={resumo.atual[metrica]} anterior={resumo.anterior[metrica]} />
                          </td>
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                </div>
              </div>
            ) : (
              <EstadoVazio titulo="Nenhuma venda" texto="Nada vendido nesses dois períodos com esses filtros." />
            )}
          </div>
          {metrica === 'clientes' && linhas.length > 1 ? (
            <p className="hint comparativo-aviso">
              No total, cada cliente conta uma vez só — por isso ele pode ser menor que a soma dos representantes.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function IntervaloDatas({
  id,
  rotulo,
  periodo,
  aoMudar,
}: {
  id: string
  rotulo: string
  periodo: Periodo
  aoMudar: (p: Periodo) => void
}) {
  return (
    <div className="field consulta-filtro comparativo-intervalo">
      <label htmlFor={`${id}-inicio`}>{rotulo}</label>
      <div className="comparativo-intervalo-datas">
        <input
          id={`${id}-inicio`}
          type="date"
          aria-label={`${rotulo}: início`}
          value={periodo.inicio}
          onChange={(e) => aoMudar({ ...periodo, inicio: e.target.value })}
        />
        <span aria-hidden="true">a</span>
        <input
          type="date"
          aria-label={`${rotulo}: fim`}
          value={periodo.fim}
          onChange={(e) => aoMudar({ ...periodo, fim: e.target.value })}
        />
      </div>
    </div>
  )
}

function diferenca(atual: number, anterior: number, unidade: (typeof UNIDADE_DA_METRICA)[Metrica]): string {
  const d = atual - anterior
  return `${d > 0 ? '+' : d < 0 ? '−' : ''}${formatarValorMeta(Math.abs(d), unidade)}`
}

/** "▲ 12,4%" verde, "▼ 3,0%" vermelho; "novo" quando o período anterior não teve venda. */
function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
  const pct = variacao(atual, anterior)
  if (pct === null) {
    return atual > 0 ? <span className="variacao is-alta">novo</span> : <span className="variacao">—</span>
  }
  const classe = pct > 0.05 ? ' is-alta' : pct < -0.05 ? ' is-baixa' : ''
  const seta = pct > 0.05 ? '▲ ' : pct < -0.05 ? '▼ ' : ''
  return (
    <span className={`variacao${classe}`}>
      {seta}
      {Math.abs(pct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
    </span>
  )
}
