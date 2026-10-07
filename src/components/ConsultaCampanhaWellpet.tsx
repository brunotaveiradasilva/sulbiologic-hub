import { useMemo, useState } from 'react'
import { CarregandoTelaInteira } from './CarregandoTelaInteira'
import { EstadoVazio } from './EstadoVazio'
import { SeletorMes } from './SeletorMes'
import { useCampanhaWellpet } from '../hooks/useCampanhaWellpet'
import { formatarData } from '../lib/datas'
import { mesAtual, rotuloMes, rotuloMesCurto } from '../lib/mes'
import { formatarValorMeta } from '../lib/unidadeMeta'
import type { ClienteCampanhaWellpet } from '../types'

const TODOS = ''

type Situacao = 'todos' | 'faltam' | 'positivados'

interface Resumo {
  representante: string
  clientes: number
  positivados: number
  reais: number
}

function resumir(representante: string, clientes: ClienteCampanhaWellpet[]): Resumo {
  return {
    representante,
    clientes: clientes.length,
    positivados: clientes.filter((c) => c.positivado).length,
    reais: clientes.reduce((s, c) => s + (c.positivado ? c.wellpetReais : 0), 0),
  }
}

/** Maiúsculas e sem acento, pra busca por nome não depender de como foi digitado. */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

/**
 * Campanha de positivação Wellpet: os clientes da carteira de cada representante que nunca compraram
 * Wellpet, separados entre quem já comprou no mês da campanha e quem ainda falta. A lista sai do
 * histórico da ADS (o admin monta uma vez por mês); a positivação é sincronizada todo dia. Sem
 * podeEditar (supervisor e representante), só consulta.
 */
export function ConsultaCampanhaWellpet({ podeEditar }: { podeEditar: boolean }) {
  const camp = useCampanhaWellpet()
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
        .sort((a, b) => b.clientes - a.clientes),
    [representantes, doMes],
  )

  const termo = normalizar(busca.trim())
  const visiveis = termo
    ? doRepresentante.filter((c) => normalizar(c.nome).includes(termo) || c.codigoCliente.includes(termo) || c.cnpjCpf.includes(termo))
    : doRepresentante
  const positivados = visiveis
    .filter((c) => c.positivado)
    .sort((a, b) => (a.primeiraCompraWellpet ?? '').localeCompare(b.primeiraCompraWellpet ?? '') || a.nome.localeCompare(b.nome, 'pt-BR'))
  // Quem comprou com o representante mais recentemente vem primeiro: é o cliente mais fácil de visitar.
  const faltam = visiveis
    .filter((c) => !c.positivado)
    .sort((a, b) => (b.ultimaCompra ?? '').localeCompare(a.ultimaCompra ?? '') || a.nome.localeCompare(b.nome, 'pt-BR'))

  function montar() {
    const jaTem = doMes.length > 0
    const aviso =
      `Montar a lista de ${rotuloMes(mes)} a partir da ADS?\n\n` +
      'Entram os clientes que compraram com cada representante nos 12 meses antes e que nunca compraram Wellpet ' +
      'desde o lançamento (set/2025). A busca varre mais de um ano de vendas e leva alguns minutos.' +
      (jaTem ? '\n\nA lista atual desse mês será substituída.' : '')
    if (!window.confirm(aviso)) return
    setRepresentante(TODOS)
    camp.montar(mes)
  }

  function mudarMes(novo: string) {
    setMes(novo)
    setRepresentante(TODOS)
  }

  const percentual = resumo.clientes > 0 ? (resumo.positivados / resumo.clientes) * 100 : 0

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
          <label htmlFor="wp-representante">Representante</label>
          <select id="wp-representante" value={representante} onChange={(e) => setRepresentante(e.target.value)}>
            <option value={TODOS}>Todos os representantes</option>
            {representantes.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <SeletorMes id="wp-mes" mes={mes} mesesComDados={mesesComDados} aoMudar={mudarMes} />
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
            texto="Monte a lista a partir da ADS: os clientes de cada representante que nunca compraram Wellpet. Depois, quem comprar no mês aparece como positivado."
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
              <span className="label">Clientes sem Wellpet</span>
              <span className="value">{resumo.clientes}</span>
            </div>
            <div className="stat">
              <span className="label">Já positivaram</span>
              <span className="value">
                {resumo.positivados}
                <span className="wp-pct"> {percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span>
              </span>
            </div>
            <div className="stat">
              <span className="label">Ainda faltam</span>
              <span className="value">{resumo.clientes - resumo.positivados}</span>
            </div>
            <div className="stat">
              <span className="label">Wellpet vendido</span>
              <span className="value">{formatarValorMeta(resumo.reais, 'REAL')}</span>
            </div>
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
                        <th className="num">Sem Wellpet</th>
                        <th className="num">Positivaram</th>
                        <th className="num">Faltam</th>
                        <th>Positivação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porRepresentante.map((r) => {
                        const pct = r.clientes > 0 ? (r.positivados / r.clientes) * 100 : 0
                        return (
                          <tr key={r.representante}>
                            <td className="cell-material">
                              <button className="wp-link" onClick={() => setRepresentante(r.representante)}>
                                {r.representante}
                              </button>
                            </td>
                            <td className="num">{r.clientes}</td>
                            <td className="num">{r.positivados}</td>
                            <td className="num">{r.clientes - r.positivados}</td>
                            <td>
                              <BarraPositivacao percentual={pct} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <div className="consulta-filtros wp-filtros-lista">
            <div className="field consulta-filtro">
              <label htmlFor="wp-busca">Buscar cliente</label>
              <input
                id="wp-busca"
                type="search"
                placeholder="Nome, código ou CPF/CNPJ"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="field consulta-filtro consulta-filtro-mes">
              <label htmlFor="wp-situacao">Situação</label>
              <select id="wp-situacao" value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)}>
                <option value="todos">Todos</option>
                <option value="faltam">Ainda faltam</option>
                <option value="positivados">Já positivaram</option>
              </select>
            </div>
          </div>

          {situacao !== 'faltam' ? (
            <div className="meta-card">
              <div className="meta-card-head">
                <h3>
                  <span className="chip wp-positivou">Já positivaram</span>
                  {representante === TODOS ? '' : ` ${representante}`}
                </h3>
                <span className="meta-badge">{positivados.length}</span>
              </div>
              {positivados.length ? (
                <div className="table-scroll">
                  <div className="table-wrap">
                    <table className="tabela-wellpet">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>1ª compra</th>
                          <th className="num">Unidades</th>
                          <th className="num">Wellpet (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positivados.map((c) => (
                          <tr key={c.id}>
                            <Cliente cliente={c} mostrarRepresentante={representante === TODOS} />
                            <td className="date">{c.primeiraCompraWellpet ? formatarData(c.primeiraCompraWellpet) : '—'}</td>
                            <td className="num">{c.wellpetUnidades.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                            <td className="num">{formatarValorMeta(c.wellpetReais, 'REAL')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="wp-vazio">Ninguém {termo ? 'com essa busca ' : ''}comprou Wellpet ainda em {rotuloMesCurto(mes)}.</p>
              )}
            </div>
          ) : null}

          {situacao !== 'positivados' ? (
            <div className="meta-card">
              <div className="meta-card-head">
                <h3>
                  <span className="chip wp-falta">Ainda faltam</span>
                  {representante === TODOS ? '' : ` ${representante}`}
                </h3>
                <span className="meta-badge">{faltam.length}</span>
              </div>
              {faltam.length ? (
                <div className="table-scroll">
                  <div className="table-wrap">
                    <table className="tabela-wellpet">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>CPF/CNPJ</th>
                          <th>Última compra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faltam.map((c) => (
                          <tr key={c.id}>
                            <Cliente cliente={c} mostrarRepresentante={representante === TODOS} />
                            <td className="date">{documento(c.cnpjCpf)}</td>
                            <td className="date">{c.ultimaCompra ? formatarData(c.ultimaCompra) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="wp-vazio">{termo ? 'Ninguém com essa busca.' : 'Todos os clientes da lista já positivaram.'}</p>
              )}
            </div>
          ) : null}
        </>
      )}

      {camp.ocupado === 'montando' ? (
        <CarregandoTelaInteira texto="Montando a lista: buscando mais de um ano de vendas na ADS…" progresso={camp.progresso} />
      ) : camp.ocupado === 'sincronizando' ? (
        <CarregandoTelaInteira texto="Buscando as compras de Wellpet do mês na ADS…" progresso={camp.progresso} />
      ) : null}
    </div>
  )
}

function Cliente({ cliente: c, mostrarRepresentante }: { cliente: ClienteCampanhaWellpet; mostrarRepresentante: boolean }) {
  return (
    <td className="cell-material">
      {c.nome}
      <span className="meta-em-reais">
        {c.codigoCliente}
        {c.segmento ? ` · ${c.segmento.toLowerCase()}` : ''}
        {mostrarRepresentante ? ` · ${c.representante}` : ''}
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
      <span className="meta-progress-pct">{percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span>
    </div>
  )
}

/** "06423246114" -> "064.232.461-14"; CNPJ com a máscara dele; outro formato fica como veio. */
function documento(s: string): string {
  if (/^\d{11}$/.test(s)) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (/^\d{14}$/.test(s)) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return s || '—'
}
