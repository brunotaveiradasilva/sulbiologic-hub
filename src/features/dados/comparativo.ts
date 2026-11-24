import { hoje } from '../../shared/lib/datas'
import { mesAtual, rotuloMesCurto, somarMeses } from '../../shared/lib/mes'
import type { ValoresVenda } from '../../types'

/**
 * Períodos da aba Dados. Datas em texto ISO (AAAA-MM-DD), como no resto do app: comparar dois
 * dias é comparar dois textos.
 */
export interface Periodo {
  inicio: string
  fim: string
}

export type TipoComparacao = 'mesAnoAnterior' | 'mesAnterior' | 'acumuladoAno' | 'personalizado'

export const TIPOS_COMPARACAO: { valor: TipoComparacao; rotulo: string }[] = [
  { valor: 'mesAnoAnterior', rotulo: 'Mês × mesmo mês do ano anterior' },
  { valor: 'mesAnterior', rotulo: 'Mês × mês anterior' },
  { valor: 'acumuladoAno', rotulo: 'Acumulado do ano × ano anterior' },
  { valor: 'personalizado', rotulo: 'Períodos livres' },
]

export type Metrica = keyof ValoresVenda

export const METRICAS: { valor: Metrica; rotulo: string }[] = [
  { valor: 'valor', rotulo: 'R$' },
  { valor: 'kg', rotulo: 'kg' },
  { valor: 'clientes', rotulo: 'Clientes' },
]

/** Unidade pra formatarValorMeta. */
export const UNIDADE_DA_METRICA = { valor: 'REAL', kg: 'KG', clientes: 'CLIENTES' } as const

function diasNoMes(mes: string): number {
  const [ano, m] = mes.split('-').map(Number)
  return new Date(ano, m, 0).getDate()
}

/** "2026-09" + 24 -> "2026-09-24"; dia maior que o mês (31 em setembro) vira o último dia. */
function diaDoMes(mes: string, dia: number): string {
  return `${mes}-${String(Math.min(dia, diasNoMes(mes))).padStart(2, '0')}`
}

/**
 * O mês escolhido (até hoje, se for o atual) e o período com que ele é comparado. Com `mesmoDia`,
 * mês em andamento é comparado só até o mesmo dia no outro período — senão setembro pela metade
 * sempre "perde" pro agosto inteiro.
 */
export function periodosDaComparacao(
  tipo: Exclude<TipoComparacao, 'personalizado'>,
  mes: string,
  mesmoDia: boolean,
): { atual: Periodo; anterior: Periodo } {
  const emAndamento = mes === mesAtual()
  const diaHoje = Number(hoje().slice(8, 10))
  const ateDia = emAndamento ? diaHoje : diasNoMes(mes)
  // Cortado no mesmo dia só se o mês ainda não acabou; mês fechado compara inteiro com inteiro.
  const ateDiaOutro = (outro: string) => (emAndamento && mesmoDia ? diaDoMes(outro, diaHoje) : diaDoMes(outro, 31))

  if (tipo === 'acumuladoAno') {
    const ano = Number(mes.slice(0, 4))
    const mesAnoAnterior = somarMeses(mes, -12)
    return {
      atual: { inicio: `${ano}-01-01`, fim: diaDoMes(mes, ateDia) },
      anterior: { inicio: `${ano - 1}-01-01`, fim: ateDiaOutro(mesAnoAnterior) },
    }
  }

  const outro = somarMeses(mes, tipo === 'mesAnterior' ? -1 : -12)
  return {
    atual: { inicio: `${mes}-01`, fim: diaDoMes(mes, ateDia) },
    anterior: { inicio: `${outro}-01`, fim: ateDiaOutro(outro) },
  }
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "Setembro/2025" (mês inteiro), "1 a 24 de set/2026" (pedaço do mês) ou "01/01/2025 a 24/09/2025". */
export function rotuloPeriodo({ inicio, fim }: Periodo): string {
  const mesInicio = inicio.slice(0, 7)
  const [ano, m, diaInicio] = inicio.split('-').map(Number)
  const diaFim = Number(fim.slice(8, 10))
  if (mesInicio === fim.slice(0, 7)) {
    if (diaInicio === 1 && diaFim === diasNoMes(mesInicio)) return rotuloMesCurto(mesInicio)
    return `${diaInicio} a ${diaFim} de ${MESES_CURTOS[m - 1]}/${ano}`
  }
  const br = (iso: string) => iso.split('-').reverse().join('/')
  return `${br(inicio)} a ${br(fim)}`
}

/** Variação percentual de `anterior` pra `atual`; null quando não tem base (anterior zero). */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return ((atual - anterior) / Math.abs(anterior)) * 100
}

/** Meses pro filtro: do atual até 3 anos atrás, do mais novo pro mais antigo. */
export function mesesDoFiltro(): string[] {
  const atual = mesAtual()
  return Array.from({ length: 37 }, (_, i) => somarMeses(atual, -i))
}

/** Período válido pra mandar pra API: datas completas, início antes do fim e no máximo um ano. */
export function erroDoPeriodo({ inicio, fim }: Periodo): string | null {
  const data = /^\d{4}-\d{2}-\d{2}$/
  if (!data.test(inicio) || !data.test(fim) || inicio < '2000-01-01') return 'Preencha as duas datas.'
  if (fim < inicio) return 'O fim vem antes do início.'
  const umAnoDepois = `${Number(inicio.slice(0, 4)) + 1}${inicio.slice(4)}`
  if (fim >= umAnoDepois) return 'Escolha um período de até um ano.'
  return null
}
