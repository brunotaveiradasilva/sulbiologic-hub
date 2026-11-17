import type { Representante } from '../types'

/**
 * Representantes que aparecem nos seletores de consulta: só quem tem código ADS. Sem código não há
 * venda sincronizada, então o cadastro é sobra (ex.: duplicado que ficou preso a metas de mês fechado)
 * e só continua visível em Cadastros → Representantes.
 */
export function representantesComCodigoAds(representantes: Representante[]): Representante[] {
  return representantes.filter((r) => r.codigoAds?.trim())
}
