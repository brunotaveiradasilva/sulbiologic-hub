/**
 * Datas são guardadas como texto ISO (AAAA-MM-DD), sem horário.
 * Assim a comparação entre duas datas é a comparação entre dois textos,
 * sem surpresa de fuso horário.
 */

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function paraISO(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function hoje(): string {
  return paraISO(new Date())
}

export function somarDias(dias: number, base = new Date()): string {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  return paraISO(d)
}

/** 2026-09-08 -> 08/09/2026 */
export function formatarData(iso: string): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/** 2026-09-08 -> "ter" */
export function diaDaSemana(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return SEMANA[new Date(ano, mes - 1, dia).getDay()]
}

/** Diferença em dias entre duas datas ISO (b - a). */
export function diasEntre(a: string, b: string): number {
  const [aa, am, ad] = a.split('-').map(Number)
  const [ba, bm, bd] = b.split('-').map(Number)
  const inicio = Date.UTC(aa, am - 1, ad)
  const fim = Date.UTC(ba, bm - 1, bd)
  return Math.round((fim - inicio) / 86_400_000)
}
