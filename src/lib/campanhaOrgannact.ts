import { formatarData } from './datas'
import type { ClienteCampanhaOrgannact } from '../types'

export const SEMANAS = [1, 2, 3, 4] as const

/** Dias da semana do mês: 1–7, 8–14, 15–21 e 22 até o último dia. */
function diasDaSemana(mes: string, semana: number): { inicio: string; fim: string } {
  const [ano, m] = mes.split('-').map(Number)
  const ultimoDia = new Date(ano, m, 0).getDate()
  const dia = (d: number) => `${mes}-${String(d).padStart(2, '0')}`
  return { inicio: dia(1 + 7 * (semana - 1)), fim: dia(semana === 4 ? ultimoDia : 7 * semana) }
}

/** "1–7/10" */
export function rotuloDias(mes: string, semana: number): string {
  const { inicio, fim } = diasDaSemana(mes, semana)
  return `${Number(inicio.slice(8))}–${Number(fim.slice(8))}/${mes.slice(5)}`
}

export function reaisDaSemana(c: ClienteCampanhaOrgannact, semana: number): number {
  return [c.semana1Reais, c.semana2Reais, c.semana3Reais, c.semana4Reais][semana - 1]
}

/** "06423246114" -> "064.232.461-14"; CNPJ com a máscara dele; outro formato fica como veio. */
function documento(s: string): string {
  if (/^\d{11}$/.test(s)) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (/^\d{14}$/.test(s)) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return s || '—'
}

/** A linha embaixo do nome do cliente, na tela e no PDF. */
export function detalheCliente(c: ClienteCampanhaOrgannact): string {
  const segmento = c.segmento ? ` · ${c.segmento.toLowerCase()}` : ''
  const situacao = c.positivado
    ? `1ª compra ${c.primeiraCompra ? formatarData(c.primeiraCompra) : '—'}`
    : `${documento(c.cnpjCpf)} · últ. compra ${c.ultimaCompra ? formatarData(c.ultimaCompra) : '—'}`
  return `${c.codigoCliente}${segmento} · ${situacao}`
}
