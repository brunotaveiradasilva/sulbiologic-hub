import type { UnidadeMeta } from '../../types'

/** Rótulo de cada unidade fixa de meta, pra mostrar na tela. */
export const ROTULO_UNIDADE_META: Record<UnidadeMeta, string> = {
  KG: 'kg',
  UNIDADE: 'unidade',
  REAL: 'R$',
  CLIENTES: 'clientes',
}

export const UNIDADES_META: UnidadeMeta[] = ['KG', 'UNIDADE', 'REAL', 'CLIENTES']

/**
 * Valor de meta/realizado/falta pra tabela, já com a unidade: "R$ 1.250,00", "34.000,0 kg", "29 clientes", "12 un".
 * CLIENTES e UNIDADE são contagem (sem "468,0"); R$ usa centavos.
 */
export function formatarValorMeta(n: number, unidade: UnidadeMeta): string {
  const casas = unidade === 'REAL' ? 2 : unidade === 'KG' ? 1 : 0
  const numero = n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
  switch (unidade) {
    case 'REAL':
      return `R$ ${numero}`
    case 'KG':
      return `${numero} kg`
    case 'CLIENTES':
      return `${numero} ${Math.abs(n) === 1 ? 'cliente' : 'clientes'}`
    case 'UNIDADE':
      return `${numero} un`
  }
}
