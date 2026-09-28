import { useMemo, useState } from 'react'
import { BotoesOrdemMeta } from './BotoesOrdemMeta'
import { DetalhesMeta } from './DetalhesMeta'
import { DialogoExportarPdf } from './DialogoExportarPdf'
import { EstadoVazio } from './EstadoVazio'
import { SeletorMes } from './SeletorMes'
import { rotuloMesCurto } from '../lib/mes'
import { formatarValorMeta } from '../lib/unidadeMeta'
import { exportarPdfMetasRepresentante } from '../lib/pdfMetasRepresentante'
import type { Fornecedor, Meta, MetaRepresentante, Representante, TotalVendidoMensal } from '../types'

interface Props {
  representantes: Representante[]
  metas: Meta[]
  metasRepresentante: MetaRepresentante[]
  totaisVendidos: TotalVendidoMensal[]
  mes: string
  aoMudarMes: (mes: string) => void
  /** Muda a ordem das metas (a mesma pra todas as telas), trocando com a vizinha visível aqui. Sem ele, só consulta. */
  aoTrocarOrdem?: (meta: Meta, vizinha: Meta) => void
}

interface Linha {
  meta: Meta
  atribuicao: MetaRepresentante | null
  valorMeta: number
  valorRealizado: number
  falta: number
  percentual: number | null
}

/**
 * Metas do mês escolhido, de todos os fornecedores para quem o representante trabalha — um card por
 * fornecedor quando ele trabalha pra mais de um. Os valores só se editam na tela "Meta Fornecedor";
 * aqui dá pra mudar só a ordem das metas.
 */
export function ConsultaMetasPorRepresentante({
  representantes,
  metas,
  metasRepresentante,
  totaisVendidos,
  mes,
  aoMudarMes,
  aoTrocarOrdem,
}: Props) {
  const [representanteId, setRepresentanteId] = useState(representantes[0]?.id ?? '')
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [escolhendoFornecedores, setEscolhendoFornecedores] = useState(false)
  const representante = representantes.find((v) => v.id === representanteId) ?? null
  const mesesComDados = useMemo(() => [...new Set(metasRepresentante.map((mv) => mv.mes))], [metasRepresentante])

  const linhas = useMemo((): Linha[] => {
    if (!representante) return []
    const fornecedorIds = new Set(representante.fornecedores.map((f) => f.id))
    // Sem ordenar aqui: as metas já vêm na ordem que o admin escolheu na aba Metas.
    return metas
      .filter((m) => fornecedorIds.has(m.fornecedor.id))
      .map((meta) => {
        const atribuicao =
          metasRepresentante.find(
            (mv) => mv.representante.id === representanteId && mv.meta.id === meta.id && mv.mes === mes,
          ) ?? null
        const valorMeta = atribuicao?.valorMeta ?? 0
        const valorRealizado = atribuicao?.valorRealizado ?? 0
        const falta = Math.max(0, valorMeta - valorRealizado)
        const percentual = valorMeta > 0 ? (valorRealizado / valorMeta) * 100 : null
        return { meta, atribuicao, valorMeta, valorRealizado, falta, percentual }
      })
  }, [representante, metas, metasRepresentante, representanteId, mes])

  // Um grupo por fornecedor, na ordem da primeira meta de cada um.
  const grupos = useMemo(() => {
    const porFornecedor = new Map<string, { fornecedor: Fornecedor; linhas: Linha[] }>()
    for (const linha of linhas) {
      const f = linha.meta.fornecedor
      if (!porFornecedor.has(f.id)) porFornecedor.set(f.id, { fornecedor: f, linhas: [] })
      porFornecedor.get(f.id)!.linhas.push(linha)
    }
    return [...porFornecedor.values()]
  }, [linhas])
  const separarPorFornecedor = (representante?.fornecedores.length ?? 0) > 1 && grupos.length > 0

  const comMeta = linhas.filter((l) => l.percentual !== null)
  const progressoMedio = comMeta.length
    ? comMeta.reduce((soma, l) => soma + Math.min(l.percentual!, 100), 0) / comMeta.length
    : null
  const totalVendido = totaisVendidos.find((t) => t.representanteId === representanteId && t.mes === mes)?.total ?? 0

  /** Com mais de um fornecedor, pergunta quais entram no relatório; com um só, gera direto. */
  function clicarExportar() {
    if (separarPorFornecedor) setEscolhendoFornecedores(true)
    else exportarPdf(null)
  }

  /** `fornecedorIds` null = todos. */
  async function exportarPdf(fornecedorIds: string[] | null) {
    if (!representante) return
    const escolhidos = fornecedorIds ? grupos.filter((g) => fornecedorIds.includes(g.fornecedor.id)) : grupos
    const todos = escolhidos.length === grupos.length
    const linhasEscolhidas = escolhidos.flatMap((g) => g.linhas)
    const comMetaEscolhidas = linhasEscolhidas.filter((l) => l.percentual !== null)
    setGerandoPdf(true)
    try {
      await exportarPdfMetasRepresentante({
        representante: representante.nome,
        mes,
        grupos: separarPorFornecedor
          ? escolhidos.map((g) => ({ titulo: g.fornecedor.nome, linhas: g.linhas }))
          : [{ linhas }],
        progressoMedio: comMetaEscolhidas.length
          ? comMetaEscolhidas.reduce((soma, l) => soma + Math.min(l.percentual!, 100), 0) / comMetaEscolhidas.length
          : null,
        // O total vendido é do representante inteiro, não dá pra separar por fornecedor.
        totalVendido: todos ? totalVendido : null,
      })
    } catch {
      window.alert('Não deu pra gerar o PDF. Tente de novo.')
    } finally {
      setGerandoPdf(false)
    }
  }

  if (!representantes.length) {
    return <EstadoVazio titulo="Nenhum representante cadastrado" texto="Cadastre um representante pra consultar as metas dele." />
  }

  return (
    <div>
      <div className="consulta-filtros">
        <div className="field consulta-filtro">
          <label htmlFor="cv-representante">Representante</label>
          <select id="cv-representante" value={representanteId} onChange={(e) => setRepresentanteId(e.target.value)}>
            {representantes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>
        <SeletorMes id="cv-mes" mes={mes} mesesComDados={mesesComDados} aoMudar={aoMudarMes} />
        <button className="btn consulta-exportar" disabled={!linhas.length || gerandoPdf} onClick={clicarExportar}>
          {gerandoPdf ? 'Gerando PDF…' : 'Exportar PDF'}
        </button>
      </div>

      {/* Sempre aparece: o total vendido vale mesmo pra quem não tem meta no mês. */}
      {representante ? (
        <div className="stats meta-kpis">
          <div className="stat">
            <span className="label">Progresso médio</span>
            <span className="value">
              {progressoMedio === null ? '—' : `${progressoMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`}
            </span>
          </div>
          <div className="stat">
            <span className="label">Total vendido</span>
            <span className="value">
              {totalVendido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      ) : null}

      {separarPorFornecedor ? (
        grupos.map((g) => (
          <CardMetas key={g.fornecedor.id} titulo={g.fornecedor.nome} mes={mes} linhas={g.linhas} aoTrocarOrdem={aoTrocarOrdem} />
        ))
      ) : (
        <CardMetas
          titulo={`Metas de ${representante?.nome ?? '—'}`}
          mes={mes}
          linhas={linhas}
          aoTrocarOrdem={aoTrocarOrdem}
        />
      )}

      {escolhendoFornecedores ? (
        <DialogoExportarPdf
          fornecedores={grupos.map((g) => g.fornecedor)}
          aoFechar={() => setEscolhendoFornecedores(false)}
          aoExportar={exportarPdf}
        />
      ) : null}
    </div>
  )
}

interface PropsCard {
  titulo: string
  mes: string
  linhas: Linha[]
  aoTrocarOrdem?: (meta: Meta, vizinha: Meta) => void
}

/** As setas de ordem trocam com a vizinha dentro do card — cada card é de um fornecedor só. */
function CardMetas({ titulo, mes, linhas, aoTrocarOrdem }: PropsCard) {
  return (
    <div className="meta-card">
      <div className="meta-card-head">
        <h3>{titulo}</h3>
        <span className="meta-badge">{rotuloMesCurto(mes)}</span>
      </div>

      <div className="table-scroll">
        <div className="table-wrap">
          <table className="tabela-metas-representante">
            <thead>
              <tr>
                <th>Meta</th>
                <th className="num">Meta</th>
                <th className="num">Realizado</th>
                <th className="num">Falta</th>
                <th className="num">Progresso</th>
                {aoTrocarOrdem ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ meta, atribuicao, valorMeta, valorRealizado, falta, percentual }, i) => (
                <tr key={meta.id}>
                  <td className="cell-material">
                    {meta.nome}
                    {meta.unidade === 'KG' && atribuicao?.realizadoEmReais != null ? (
                      <span className="meta-em-reais">{formatarValorMeta(atribuicao.realizadoEmReais, 'REAL')}</span>
                    ) : null}
                    <DetalhesMeta meta={meta} />
                  </td>
                  <td className="num">{percentual === null ? '—' : formatarValorMeta(valorMeta, meta.unidade)}</td>
                  <td className="num">{atribuicao ? formatarValorMeta(valorRealizado, meta.unidade) : '—'}</td>
                  <td className="num">{percentual === null ? '—' : formatarValorMeta(falta, meta.unidade)}</td>
                  <td className="num">
                    <div className="meta-progress-cell">
                      <span className="meta-progress-track">
                        <span
                          className={`meta-progress-fill${(percentual ?? 0) >= 100 ? ' is-complete' : ''}`}
                          style={{ width: `${Math.min(percentual ?? 0, 100)}%` }}
                        />
                      </span>
                      <span className="meta-progress-pct">
                        {percentual === null ? '—' : `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`}
                      </span>
                    </div>
                  </td>
                  {aoTrocarOrdem ? (
                    <td className="actions-cell">
                      <div className="row-actions">
                        <BotoesOrdemMeta
                          meta={meta}
                          anterior={linhas[i - 1]?.meta ?? null}
                          proxima={linhas[i + 1]?.meta ?? null}
                          aoTrocar={aoTrocarOrdem}
                        />
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>

          {!linhas.length ? (
            <EstadoVazio
              titulo="Nenhuma meta pra esse representante"
              texto="Nenhum dos fornecedores desse representante tem meta cadastrada ainda."
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
