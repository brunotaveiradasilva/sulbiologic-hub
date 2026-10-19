import { useEffect, useRef, useState } from 'react'
import { buscarPositivacaoClientes } from '../lib/api'
import { hoje } from '../lib/datas'
import { rotuloMes } from '../lib/mes'
import { formatarValorMeta } from '../lib/unidadeMeta'
import type { MetaRepresentante, PositivacaoClientes } from '../types'

interface Props {
  atribuicao: MetaRepresentante
  aoFechar: () => void
}

const reais = (n: number) => formatarValorMeta(n, 'REAL')

/** "1–7/10" a partir de duas datas AAAA-MM-DD do mesmo mês. */
function rotuloDias(inicio: string, fim: string): string {
  return `${Number(inicio.slice(8))}–${Number(fim.slice(8))}/${fim.slice(5, 7)}`
}

/**
 * Detalhe de uma meta de positivação (CLIENTES): quais clientes o representante positivou e quanto cada
 * um comprou em cada semana do mês. Busca na ADS ao abrir, então pode levar uns segundos.
 */
export function DialogoPositivacao({ atribuicao, aoFechar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [dados, setDados] = useState<PositivacaoClientes | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    let ativo = true
    buscarPositivacaoClientes(atribuicao.id)
      .then((d) => ativo && setDados(d))
      .catch(() => ativo && setErro('Não deu pra buscar os clientes na ADS. Tente de novo daqui a pouco.'))
    return () => {
      ativo = false
    }
  }, [atribuicao.id])

  const positivados = dados?.clientes.filter((c) => c.positivado) ?? []
  const naoContam = dados?.clientes.filter((c) => !c.positivado) ?? []
  const dataDeHoje = hoje()

  return (
    <dialog ref={ref} className="dlg-largo" onCancel={(e) => { e.preventDefault(); aoFechar() }}>
      <div className="dlg-head">
        <div>
          <h3>{atribuicao.meta.nome}</h3>
          <span className="hint">
            {atribuicao.representante.nome} · {rotuloMes(atribuicao.mes)}
          </span>
        </div>
        <button type="button" className="icon-btn" onClick={aoFechar} aria-label="Fechar">
          &times;
        </button>
      </div>

      <div className="dlg-body">
        {erro ? (
          <p className="hint">{erro}</p>
        ) : !dados ? (
          <p className="hint">Buscando as vendas na ADS…</p>
        ) : !dados.clientes.length ? (
          <p className="hint">Nenhum cliente comprou essa meta no mês ainda.</p>
        ) : (
          <>
            <div className="positivacao-semanas">
              {dados.semanas.map((s, i) => {
                const compraram = positivados.filter((c) => c.semanas[i] > 0).length
                const total = positivados.reduce((soma, c) => soma + c.semanas[i], 0)
                const futura = s.inicio > dataDeHoje
                return (
                  <div key={s.numero} className={`stat${futura ? ' is-futura' : ''}`}>
                    <span className="label">
                      Semana {s.numero} · {rotuloDias(s.inicio, s.fim)}
                    </span>
                    <span className="value">{futura ? '—' : compraram === 1 ? '1 cliente' : `${compraram} clientes`}</span>
                    {futura ? null : <span className="note">{reais(total)}</span>}
                  </div>
                )
              })}
            </div>

            <div className="table-scroll">
              <table className="tabela-positivacao">
                <thead>
                  <tr>
                    <th>Cliente ({positivados.length} positivado{positivados.length === 1 ? '' : 's'})</th>
                    {dados.semanas.map((s) => (
                      <th key={s.numero} className="num" title={rotuloDias(s.inicio, s.fim)}>
                        Sem {s.numero}
                      </th>
                    ))}
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {positivados.map((c) => (
                    <LinhaCliente key={c.codigo} cliente={c} />
                  ))}
                  {naoContam.length ? (
                    <tr className="positivacao-separador">
                      <td colSpan={dados.semanas.length + 2}>Compraram e devolveram — não contam na meta</td>
                    </tr>
                  ) : null}
                  {naoContam.map((c) => (
                    <LinhaCliente key={c.codigo} cliente={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="dlg-foot">
        <button type="button" className="btn" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </dialog>
  )
}

function LinhaCliente({ cliente }: { cliente: PositivacaoClientes['clientes'][number] }) {
  return (
    <tr className={cliente.positivado ? undefined : 'is-nao-conta'}>
      <td className="cell-material">
        {cliente.nome ?? 'Cliente sem nome'}
        <span className="cell-code">{cliente.codigo}</span>
      </td>
      {cliente.semanas.map((v, i) => (
        <td key={i} className={`num${v > 0 ? ' is-comprou' : ''}`}>
          {v === 0 ? '—' : reais(v)}
        </td>
      ))}
      <td className="num">
        <strong>{reais(cliente.total)}</strong>
      </td>
    </tr>
  )
}
