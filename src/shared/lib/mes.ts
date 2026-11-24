/**
 * Meses de referência das metas, guardados como texto "AAAA-MM" (ex.: "2026-09") — o mesmo
 * formato da API. Comparar dois meses é comparar dois textos.
 */

const NOMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** Mês atual no horário de Brasília (o mesmo critério da API). */
export function mesAtual(): string {
  // en-CA formata ano e mês como "2026-09".
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(
    new Date(),
  )
}

/** Mês que já acabou fica só pra consulta: em outubro, as metas de setembro não mudam mais (a API também barra). */
export function mesFechado(mes: string): boolean {
  return mes < mesAtual()
}

/** "2026-09" + (-1) -> "2026-08" */
export function somarMeses(mes: string, quantidade: number): string {
  const [ano, m] = mes.split('-').map(Number)
  const total = ano * 12 + (m - 1) + quantidade
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/** "2026-09" -> "setembro de 2026" */
export function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  return `${NOMES[m - 1]} de ${ano}`
}

/** "2026-09" -> "Setembro/2026", pra caber em select e badge. */
export function rotuloMesCurto(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  const nome = NOMES[m - 1]
  return `${nome[0].toUpperCase()}${nome.slice(1)}/${ano}`
}

/** Data de hoje pra nome de arquivo: "24-09-2026" (dia-mês-ano, sem barra, que não vale em nome de arquivo). */
export function dataDeHojeParaArquivo(): string {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '-')
}

/**
 * Meses que aparecem no filtro: do mais novo pro mais antigo, de 2 meses à frente (pra já cadastrar
 * a meta do mês que vem) até 12 meses atrás, mais qualquer mês que já tenha dado cadastrado.
 */
export function opcoesDeMes(mesesComDados: Iterable<string>): string[] {
  const atual = mesAtual()
  const meses = new Set<string>(mesesComDados)
  for (let i = -12; i <= 2; i++) meses.add(somarMeses(atual, i))
  return [...meses].sort().reverse()
}
