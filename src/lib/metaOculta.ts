import type { Meta, MetaRepresentante } from '../types'

/**
 * As metas que entram nas consultas do mês: todas as visíveis, e as ocultas só se tiverem algum valor de
 * meta naquele mês — assim uma meta que valeu só em setembro some de outubro em diante, mas setembro
 * continua mostrando ela.
 */
export function metasDoMes(metas: Meta[], metasRepresentante: MetaRepresentante[], mes: string): Meta[] {
  const comValor = new Set(metasRepresentante.filter((mv) => mv.mes === mes && mv.valorMeta > 0).map((mv) => mv.meta.id))
  return metas.filter((m) => !m.oculta || comValor.has(m.id))
}
