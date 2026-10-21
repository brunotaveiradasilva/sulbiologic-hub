import { useMemo, useState } from 'react'
import { CarregandoTelaInteira } from './CarregandoTelaInteira'
import { EstadoVazio } from './EstadoVazio'
import { SeletorMes } from './SeletorMes'
import { useCampanhaOrgannact } from '../hooks/useCampanhaPositivacao'
import { formatarData, hoje } from '../lib/datas'
import { mesAtual, rotuloMes, rotuloMesCurto } from '../lib/mes'
import { formatarValorMeta } from '../lib/unidadeMeta'
import type { ClienteCampanhaOrgannact } from '../types'

const TODOS = ''
const SEMANAS = [1, 2, 3, 4] as const

/** 'todos', 'faltam' ou a semana em que positivou ('1' a '4'). */
type Situacao = 'todos' | 'faltam' | '1' | '2' | '3' | '4'

interface Resumo {
  representante: string
  clientes: number
  positivados: number
  /** Quantos positivaram em cada semana (a da primeira compra). */
  porSemana: number[]
  reais: number
}

function resumir(representante: string, clientes: ClienteCampanhaOrgannact[]): Resumo {
  return {
    representante,
    clientes: clientes.length,
    positivados: clientes.filter((c) => c.positivado).length,
    porSemana: SEMANAS.map((s) => clientes.filter((c) => c.semanaPositivacao === s).length),
    reais: clientes.reduce((s, c) => s + (c.positivado ? c.organnactReais : 0), 0),
  }
}

/** Dias da semana do mês: 1–7, 8–14, 15–21 e 22 até o último dia. */
function diasDaSemana(mes: string, semana: number): { inicio: string; fim: string } {
  const [ano, m] = mes.split('-').map(Number)
  const ultimoDia = new Date(ano, m, 0).getDate()
  const dia = (d: number) => `${mes}-${String(d).padStart(2, '0')}`
  return { inicio: dia(1 + 7 * (semana - 1)), fim: dia(semana === 4 ? ultimoDia : 7 * semana) }
}

/** "1–7/10" */
function rotuloDias(mes: string, semana: number): string {
  const { inicio, fim } = diasDaSemana(mes, semana)
  return `${Number(inicio.slice(8))}–${Number(fim.slice(8))}/${mes.slice(5)}`
}

function reaisDaSemana(c: ClienteCampanhaOrgannact, semana: number): number {
  return [c.semana1Reais, c.semana2Reais, c.semana3Reais, c.semana4Reais][semana - 1]
}

/** Maiúsculas e sem acento, pra busca por nome não depender de como foi digitado. */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

const pct = (parte: number, todo: number) => (todo > 0 ? (parte / todo) * 100 : 0)
const formatarPct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`

/**
 * Campanha de positivação Organnact: toda a carteira dos representantes com meta Organnact no mês,
 * separada pela semana em que cada cliente positivou (a da primeira compra de Organnact no mês) e quem
 * ainda falta. A lista sai do histórico da ADS (o admin monta uma vez por mês); a positivação é
 * sincronizada todo dia. Sem podeEditar (supervisor e representante), só consulta.
 */
export function ConsultaCampanhaOrgannact({ podeEditar }: { podeEditar: boolean }) {
  const camp = useCampanhaOrgannact()
  const [mes, setMes] = useState(mesAtual)
  const [representante, setRepresentante] = useState(TODOS)
  const [situacao, setSituacao] = useState<Situacao>('todos')
  const [busca, setBusca] = useState('')

  const doMes = useMemo(() => camp.clientes.filter((c) => c.mes === mes), [camp.clientes, mes])
  const mesesComDados = useMemo(() => [...new Set(camp.clientes.map((c) => c.mes))], [camp.clientes])
  const representantes = useMemo(
    () => [...new Set(doMes.map((c) => c.representante))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [doMes],
  )
  const doRepresentante = representante === TODOS ? doMes : doMes.filter((c) => c.representante === representante)
  const resumo = resumir(representante, doRepresentante)
  const porRepresentante = useMemo(
    () =>
      representantes
        .map((r) => resumir(r, doMes.filter((c) => c.representante === r)))
        .sort((a, b) => pct(b.positivados, b.clientes) - pct(a.positivados, a.clientes)),
    [representantes, doMes],
  )

  const termo = normalizar(busca.trim())
  const visiveis = termo
    ? doRepresentante.filter((c) => normalizar(c.nome).includes(termo) || c.codigoCliente.includes(termo) || c.cnpjCpf.includes(termo))
    : doRepresentante
  // Grade cliente × semana: quem positivou vem primeiro, pela semana e depois por quem comprou mais;
  // depois quem falta, quem comprou com o representante mais recentemente primeiro (o mais fácil de visitar).
  const gradeVisivel = visiveis
    .filter((c) =>
      situacao === 'todos' ? true : situacao === 'faltam' ? !c.positivado : c.semanaPositivacao === Number(situacao),
    )
    .sort(
      (a, b) =>
        (a.semanaPositivacao ?? 9) - (b.semanaPositivacao ?? 9) ||
        b.organnactReais - a.organnactReais ||
        (b.ultimaCompra ?? '').localeCompare(a.ultimaCompra ?? '') ||
        a.nome.localeCompare(b.nome, 'pt-BR'),
    )
  const dataDeHoje = hoje()

  function montar() {
    const jaTem = doMes.length > 0
    const aviso =
      `Montar a lista de ${rotuloMes(mes)} a partir da ADS?\n\n` +
      'Entram todos os clientes que compraram nos 12 meses antes com cada representante que tem meta Organnact ' +
      'nesse mês. A busca varre um ano de vendas e leva alguns minutos.' +
      (jaTem ? '\n\nA lista atual desse mês será substituída.' : '')
    if (!window.confirm(aviso)) return
    setRepresentante(TODOS)
    camp.montar(mes)
  }

  function mudarMes(novo: string) {
    setMes(novo)
    setRepresentante(TODOS)
  }

  return (
    <div>
      {camp.erro ? (
        <div className="banner-erro" role="alert">
          <span>{camp.erro}</span>
          <button className="btn" onClick={camp.tentarNovamente}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      <div className="consulta-filtros">
        <div className="field consulta-filtro">
          <label htmlFor="org-representante">Representante</label>
          <select id="org-representante" value={representante} onChange={(e) => setRepresentante(e.target.value)}>
            <option value={TODOS}>Todos os representantes</option>
            {representantes.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <SeletorMes id="org-mes" mes={mes} mesesComDados={mesesComDados} aoMudar={mudarMes} />
        {podeEditar ? (
          <div className="consulta-acoes">
            <button className="btn" disabled={camp.ocupado !== null} onClick={montar}>
              {camp.ocupado === 'montando' ? 'Montando…' : doMes.length ? 'Refazer lista' : 'Montar lista'}
            </button>
            <button className="btn" disabled={camp.ocupado !== null || !doMes.length} onClick={() => camp.sincronizar(mes)}>
              {camp.ocupado === 'sincronizando' ? 'Sincronizando…' : 'Sincronizar com a ADS'}
            </button>
          </div>
        ) : null}
      </div>

      {camp.carregando && !camp.clientes.length ? (
        <EstadoVazio titulo="Carregando…" texto="Buscando os dados salvos no servidor." />
      ) : !doMes.length ? (
        podeEditar ? (
          <EstadoVazio
            titulo={`Nenhuma lista em ${rotuloMesCurto(mes)}`}
            texto="Monte a lista a partir da ADS: a carteira de cada representante com meta Organnact no mês. Depois, quem comprar Organnact aparece na semana em que positivou."
          >
            <button className="btn btn-primary" disabled={camp.ocupado !== null} onClick={montar}>
              Montar lista
            </button>
          </EstadoVazio>
        ) : (
          <EstadoVazio titulo={`Nenhum cliente em ${rotuloMesCurto(mes)}`} texto="Ainda não há lista da campanha nesse mês pra você." />
        )
      ) : (
        <>
          <div className="stats meta-kpis meta-kpis-largo">
            <div className="stat">
              <span className="label">Clientes na carteira</span>
              <span className="value">{resumo.clientes}</span>
            </div>
            <div className="stat">
              <span className="label">Já positivaram</span>
              <span className="value">
                {resumo.positivados}
                <span className="wp-pct"> {formatarPct(pct(resumo.positivados, resumo.clientes))}</span>
              </span>
            </div>
            <div className="stat">
              <span className="label">Ainda faltam</span>
              <span className="value">{resumo.clientes - resumo.positivados}</span>
            </div>
            <div className="stat">
              <span className="label">Organnact vendido</span>
              <span className="value">{formatarValorMeta(resumo.reais, 'REAL')}</span>
            </div>
          </div>

          <div className="org-semanas">
            {SEMANAS.map((s, i) => {
              const futura = diasDaSemana(mes, s).inicio > dataDeHoje
              const acumulado = resumo.porSemana.slice(0, i + 1).reduce((a, b) => a + b, 0)
              return (
                <button
                  key={s}
                  type="button"
                  className={`stat org-semana${situacao === String(s) ? ' is-ativa' : ''}${futura ? ' is-futura' : ''}`}
                  disabled={futura}
                  onClick={() => setSituacao(situacao === String(s) ? 'todos' : (String(s) as Situacao))}
                >
                  <span className="label">
                    Semana {s} · {rotuloDias(mes, s)}
                  </span>
                  <span className="value">{futura ? '—' : `+${resumo.porSemana[i]}`}</span>
                  <span className="note">
                    {futura
                      ? 'ainda não começou'
                      : `${acumulado} no acumulado · ${formatarPct(pct(acumulado, resumo.clientes))}`}
                  </span>
                </button>
              )
            })}
          </div>

          {representante === TODOS ? (
            <div className="meta-card">
              <div className="meta-card-head">
                <h3>Por representante</h3>
                <span className="meta-badge">{rotuloMesCurto(mes)}</span>
              </div>
              <div className="table-scroll">
                <div className="table-wrap">
                  <table className="tabela-wellpet">
                    <thead>
                      <tr>
                        <th>Representante</th>
                        <th className="num">Carteira</th>
                        {SEMANAS.map((s) => (
                          <th key={s} className="num" title={rotuloDias(mes, s)}>
                            Sem {s}
                          </th>
                        ))}
                        <th className="num">Faltam</th>
                        <th>Positivação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porRepresentante.map((r) => (
                        <tr key={r.representante}>
                          <td className="cell-material">
                            <button className="wp-link" onClick={() => setRepresentante(r.representante)}>
                              {r.representante}
                            </button>
                          </td>
                          <td className="num">{r.clientes}</td>
                          {r.porSemana.map((n, i) => (
                            <td key={i} className="num">
                              {n || '—'}
                            </td>
                          ))}
                          <td className="num">{r.clientes - r.positivados}</td>
                          <td>
                            <BarraPositivacao percentual={pct(r.positivados, r.clientes)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <div className="consulta-filtros wp-filtros-lista">
            <div className="field consulta-filtro">
              <label htmlFor="org-busca">Buscar cliente</label>
              <input
                id="org-busca"
                type="search"
                placeholder="Nome, código ou CPF/CNPJ"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="field consulta-filtro consulta-filtro-mes">
              <label htmlFor="org-situacao">Situação</label>
              <select id="org-situacao" value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)}>
                <option value="todos">Todos</option>
                {SEMANAS.map((s) => (
                  <option key={s} value={String(s)}>
                    Positivaram na semana {s}
                  </option>
                ))}
                <option value="faltam">Ainda faltam</option>
              </select>
            </div>
          </div>

          {gradeVisivel.length ? (
            (representante === TODOS ? representantes : [representante]).map((r) => {
              const linhas = gradeVisivel.filter((c) => c.representante === r)
              if (!linhas.length) return null
              const totalSemana = (s: number) => linhas.reduce((t, c) => t + reaisDaSemana(c, s), 0)
              return (
                <div key={r} className="meta-card">
                  <div className="meta-card-head">
                    <h3>Representante {r}</h3>
                    <span className="meta-badge">
                      {linhas.filter((c) => c.positivado).length} de {linhas.length} positivados
                    </span>
                  </div>
                  <div className="table-scroll">
                    <div className="table-wrap">
                      <table className="tabela-wellpet org-grade">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            {SEMANAS.map((s) => (
                              <th key={s} className="num">
                                Semana {s}
                                <span className="org-dias">{rotuloDias(mes, s)}</span>
                              </th>
                            ))}
                            <th className="num">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linhas.map((c) => (
                            <tr key={c.id}>
                              <Cliente cliente={c} />
                              {SEMANAS.map((s) => {
                                const v = reaisDaSemana(c, s)
                                return (
                                  <td key={s} className={`num${v > 0 ? ' org-comprou' : ''}`}>
                                    {v === 0 ? '' : formatarValorMeta(v, 'REAL')}
                                  </td>
                                )
                              })}
                              <td className="num">{c.positivado ? <strong>{formatarValorMeta(c.organnactReais, 'REAL')}</strong> : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            {SEMANAS.map((s) => (
                              <td key={s} className="num">
                                {totalSemana(s) ? formatarValorMeta(totalSemana(s), 'REAL') : ''}
                              </td>
                            ))}
                            <td className="num">
                              {formatarValorMeta(
                                SEMANAS.reduce((t, s) => t + totalSemana(s), 0),
                                'REAL',
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="meta-card">
              <p className="wp-vazio org-vazio">
                {termo
                  ? 'Ninguém com essa busca.'
                  : situacao === 'faltam'
                    ? 'Todos os clientes da carteira já positivaram.'
                    : 'Ninguém positivou nessa semana.'}
              </p>
            </div>
          )}
        </>
      )}

      {camp.ocupado === 'montando' ? (
        <CarregandoTelaInteira texto="Montando a lista: buscando um ano de vendas na ADS…" progresso={camp.progresso} />
      ) : camp.ocupado === 'sincronizando' ? (
        <CarregandoTelaInteira texto="Buscando as compras de Organnact do mês na ADS…" progresso={camp.progresso} />
      ) : null}
    </div>
  )
}

function Cliente({ cliente: c }: { cliente: ClienteCampanhaOrgannact }) {
  return (
    <td className="cell-material">
      {c.nome}
      <span className="meta-em-reais">
        {c.codigoCliente}
        {c.segmento ? ` · ${c.segmento.toLowerCase()}` : ''}
        {c.positivado
          ? ` · 1ª compra ${c.primeiraCompra ? formatarData(c.primeiraCompra) : '—'}`
          : ` · ${documento(c.cnpjCpf)} · últ. compra ${c.ultimaCompra ? formatarData(c.ultimaCompra) : '—'}`}
      </span>
    </td>
  )
}

function BarraPositivacao({ percentual }: { percentual: number }) {
  return (
    <div className="meta-progress-cell">
      <span className="meta-progress-track">
        <span
          className={`meta-progress-fill${percentual >= 100 ? ' is-complete' : ''}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </span>
      <span className="meta-progress-pct">{formatarPct(percentual)}</span>
    </div>
  )
}

/** "06423246114" -> "064.232.461-14"; CNPJ com a máscara dele; outro formato fica como veio. */
function documento(s: string): string {
  if (/^\d{11}$/.test(s)) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (/^\d{14}$/.test(s)) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return s || '—'
}
