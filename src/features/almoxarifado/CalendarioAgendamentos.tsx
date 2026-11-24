import { useMemo, useState } from 'react'
import { diasEntre, formatarData, hoje, paraISO } from '../../shared/lib/datas'
import { buscarMaterial, ROTULO_STATUS, statusExibido } from './regras'
import type { Agendamento, Material, StatusExibido } from '../../types'

interface Props {
  agendamentos: Agendamento[]
  materiais: Material[]
  aoVerDetalhes: (agendamento: Agendamento) => void
  /** Clique num dia vazio: abre um novo agendamento com a retirada naquele dia. */
  aoCriar: (dia: string) => void
}

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const LEGENDA: StatusExibido[] = ['agendado', 'retirado', 'atrasado', 'devolvido']
/** Altura mínima de uma semana, em linhas da grade (a 1ª é a do número do dia). */
const LINHAS_MINIMAS = 4

/** Um agendamento dentro de uma semana: de que coluna a que coluna (0 = domingo) e em que faixa. */
interface Barra {
  agendamento: Agendamento
  status: StatusExibido
  fim: string
  colunaInicio: number
  colunaFim: number
  faixa: number
  vemDeAntes: boolean
  continua: boolean
}

/** As semanas (domingo a sábado) que cobrem o mês, cada uma com os 7 dias em ISO. */
function semanasDoMes(ano: number, mes: number): string[][] {
  const semanas: string[][] = []
  const ultimoDia = paraISO(new Date(ano, mes + 1, 0))
  let deslocamento = 1 - new Date(ano, mes, 1).getDay()
  for (;;) {
    const semana = Array.from({ length: 7 }, (_, i) => paraISO(new Date(ano, mes, deslocamento + i)))
    if (semana[0] > ultimoDia) break
    semanas.push(semana)
    deslocamento += 7
  }
  return semanas
}

/**
 * Até quando a barra vai. Atrasado ainda está com a pessoa, então a barra estica até hoje
 * em vez de parar na devolução combinada.
 */
function fimDaBarra(a: Agendamento, status: StatusExibido, referencia: string): string {
  if (status === 'atrasado') return referencia
  return a.devolucao < a.retirada ? a.retirada : a.devolucao
}

/** Encaixa os agendamentos da semana em faixas, sem um passar por cima do outro. */
function barrasDaSemana(agendamentos: Agendamento[], semana: string[], referencia: string): Barra[] {
  const [inicioSemana, fimSemana] = [semana[0], semana[6]]

  const barras = agendamentos
    .map((agendamento) => {
      const status = statusExibido(agendamento, referencia)
      return { agendamento, status, fim: fimDaBarra(agendamento, status, referencia) }
    })
    .filter(({ agendamento, fim }) => agendamento.retirada <= fimSemana && fim >= inicioSemana)
    .map(({ agendamento, status, fim }) => ({
      agendamento,
      status,
      fim,
      colunaInicio: Math.max(0, diasEntre(inicioSemana, agendamento.retirada)),
      colunaFim: Math.min(6, diasEntre(inicioSemana, fim)),
      faixa: 0,
      vemDeAntes: agendamento.retirada < inicioSemana,
      continua: fim > fimSemana,
    }))
    // Quem começa antes vai pra cima; em empate, o mais longo.
    .sort(
      (a, b) =>
        a.colunaInicio - b.colunaInicio ||
        b.colunaFim - a.colunaFim ||
        a.agendamento.retirada.localeCompare(b.agendamento.retirada),
    )

  const ultimaColunaDaFaixa: number[] = []
  for (const barra of barras) {
    let faixa = ultimaColunaDaFaixa.findIndex((ultima) => ultima < barra.colunaInicio)
    if (faixa === -1) faixa = ultimaColunaDaFaixa.length
    ultimaColunaDaFaixa[faixa] = barra.colunaFim
    barra.faixa = faixa
  }
  return barras
}

/** Mês em grade, como uma agenda: cada agendamento é uma barra da retirada até a devolução. */
export function CalendarioAgendamentos({ agendamentos, materiais, aoVerDetalhes, aoCriar }: Props) {
  const referencia = hoje()
  const [mes, setMes] = useState(() => {
    const agora = new Date()
    return { ano: agora.getFullYear(), mes: agora.getMonth() }
  })

  const semanas = useMemo(
    () =>
      semanasDoMes(mes.ano, mes.mes).map((dias) => ({
        dias,
        barras: barrasDaSemana(agendamentos, dias, referencia),
      })),
    [mes, agendamentos, referencia],
  )

  function mudarMes(passo: number) {
    setMes((atual) => {
      const data = new Date(atual.ano, atual.mes + passo, 1)
      return { ano: data.getFullYear(), mes: data.getMonth() }
    })
  }

  function irParaHoje() {
    const agora = new Date()
    setMes({ ano: agora.getFullYear(), mes: agora.getMonth() })
  }

  const prefixoDoMes = `${mes.ano}-${String(mes.mes + 1).padStart(2, '0')}`
  const semNadaNoMes = semanas.every((s) => !s.barras.length)

  return (
    <div className="cal">
      <div className="cal-topo">
        <h3 className="cal-titulo" aria-live="polite">
          {MESES[mes.mes]} de {mes.ano}
        </h3>
        <button className="btn btn-sm" onClick={irParaHoje}>
          Hoje
        </button>
        <button className="btn btn-sm" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <button className="btn btn-sm" onClick={() => mudarMes(1)} aria-label="Próximo mês">
          ›
        </button>
      </div>

      <div className="cal-grade">
        <div className="cal-dias-semana" aria-hidden="true">
          {DIAS_SEMANA.map((dia) => (
            <span key={dia}>{dia}</span>
          ))}
        </div>

        {semanas.map(({ dias, barras }) => {
          const faixas = barras.reduce((maior, b) => Math.max(maior, b.faixa + 1), 0)
          const linhas = Math.max(LINHAS_MINIMAS, faixas + 2)

          return (
            <div className="cal-semana" key={dias[0]}>
              {dias.map((dia, coluna) => {
                const classes = ['cal-dia']
                if (!dia.startsWith(prefixoDoMes)) classes.push('is-fora')
                if (dia === referencia) classes.push('is-hoje')
                return (
                  <button
                    key={dia}
                    className={classes.join(' ')}
                    style={{ gridColumn: coluna + 1, gridRow: `1 / span ${linhas}` }}
                    onClick={() => aoCriar(dia)}
                    aria-label={`Novo agendamento em ${formatarData(dia)}`}
                    title="Novo agendamento neste dia"
                  >
                    <span className="cal-num">{Number(dia.slice(8))}</span>
                  </button>
                )
              })}

              {barras.map((b) => {
                const a = b.agendamento
                const material = buscarMaterial(materiais, a.materialId)?.nome ?? 'Material removido'
                const periodo = `${formatarData(a.retirada)} a ${formatarData(a.devolucao)}`
                const dias = diasEntre(a.retirada, b.fim) + 1
                const descricao = `${material} — ${a.responsavel}${a.cliente ? ` (${a.cliente})` : ''} · ${periodo} · ${
                  dias === 1 ? '1 dia' : `${dias} dias`
                } · ${ROTULO_STATUS[b.status]}`
                const classes = ['cal-barra', b.status]
                if (b.vemDeAntes) classes.push('vem-de-antes')
                if (b.continua) classes.push('continua')

                return (
                  <button
                    key={a.id}
                    className={classes.join(' ')}
                    style={{
                      gridColumn: `${b.colunaInicio + 1} / ${b.colunaFim + 2}`,
                      gridRow: b.faixa + 2,
                    }}
                    onClick={() => aoVerDetalhes(a)}
                    title={descricao}
                    aria-label={descricao}
                  >
                    {a.qtd > 1 ? `${a.qtd}× ` : ''}
                    {material}
                    <span className="cal-barra-quem"> · {a.responsavel}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="cal-rodape">
        {LEGENDA.map((status) => (
          <span key={status} className={`chip ${status}`}>
            {ROTULO_STATUS[status]}
          </span>
        ))}
        <span className="cal-dica">
          {semNadaNoMes
            ? 'Nenhum agendamento neste mês com os filtros atuais.'
            : 'Clique numa barra para ver o agendamento, ou num dia para criar um novo.'}
        </span>
      </div>
    </div>
  )
}
