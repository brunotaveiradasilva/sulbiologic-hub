import type { Meta } from '../../types'

/** "Dias 1 a 19" pra meta com período; null pra meta do mês inteiro. */
export function rotuloPeriodoMeta(meta: Pick<Meta, 'diaInicio' | 'diaFim'>): string | null {
  if (meta.diaInicio == null || meta.diaFim == null) return null
  return `Dias ${meta.diaInicio} a ${meta.diaFim}`
}
