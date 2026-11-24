import type { Agendamento, Material, Resumo, StatusExibido } from '../../types'
import { hoje } from '../../shared/lib/datas'

/**
 * Status que aparece na tela. Um agendamento que ainda não voltou e já passou
 * da data de devolução vira "atrasado", sem precisar de nenhuma ação manual.
 */
export function statusExibido(a: Agendamento, referencia = hoje()): StatusExibido {
  if (a.status === 'devolvido') return 'devolvido'
  if (a.devolucao < referencia) return 'atrasado'
  return a.status
}

/** Dois períodos se cruzam quando um começa antes de o outro terminar. */
function haSobreposicao(a: Agendamento, inicio: string, fim: string): boolean {
  return a.retirada <= fim && a.devolucao >= inicio
}

/**
 * Quantas unidades de um material já estão comprometidas no período informado.
 * Serve para avisar quando um novo agendamento passa do que existe em estoque.
 *
 * @param ignorarId id do agendamento em edição, que não deve contar contra si mesmo
 */
export function quantidadeComprometida(
  agendamentos: Agendamento[],
  materialId: string,
  inicio: string,
  fim: string,
  ignorarId?: string | null,
): number {
  return agendamentos
    .filter(
      (a) =>
        a.materialId === materialId &&
        a.id !== ignorarId &&
        a.status !== 'devolvido' &&
        haSobreposicao(a, inicio, fim),
    )
    .reduce((total, a) => total + a.qtd, 0)
}

/** Quantidade do material que está fora do estoque agora (retirada ou reservada). */
export function quantidadeEmPosse(agendamentos: Agendamento[], materialId: string): number {
  return agendamentos
    .filter((a) => a.materialId === materialId && a.status !== 'devolvido')
    .reduce((total, a) => total + a.qtd, 0)
}

/** Números do painel do topo. */
export function calcularResumo(agendamentos: Agendamento[], referencia = hoje()): Resumo {
  const resumo: Resumo = { retiradasHoje: 0, devolucoesHoje: 0, emPosse: 0, atrasados: 0 }

  for (const a of agendamentos) {
    if (statusExibido(a, referencia) === 'atrasado') resumo.atrasados++
    if (a.status === 'retirado') resumo.emPosse++
    if (a.status === 'agendado' && a.retirada === referencia) resumo.retiradasHoje++
    if (a.status !== 'devolvido' && a.devolucao === referencia) resumo.devolucoesHoje++
  }

  return resumo
}

export function buscarMaterial(materiais: Material[], id: string): Material | undefined {
  return materiais.find((m) => m.id === id)
}

/** Ordena por data de retirada e, em empate, por data de devolução. */
export function ordenarPorData(agendamentos: Agendamento[]): Agendamento[] {
  return [...agendamentos].sort(
    (a, b) => a.retirada.localeCompare(b.retirada) || a.devolucao.localeCompare(b.devolucao),
  )
}

/** Filtra a lista pelo status escolhido e pelo termo digitado na busca. */
export function filtrarAgendamentos(
  agendamentos: Agendamento[],
  materiais: Material[],
  filtro: string,
  termo: string,
  referencia = hoje(),
): Agendamento[] {
  const busca = termo.trim().toLowerCase()

  return ordenarPorData(
    agendamentos.filter((a) => {
      if (filtro !== 'todos' && statusExibido(a, referencia) !== filtro) return false
      if (!busca) return true

      const material = buscarMaterial(materiais, a.materialId)
      const alvo = [material?.nome, material?.codigo, a.responsavel, a.cliente, a.obs]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return alvo.includes(busca)
    }),
  )
}

/** Clientes já cadastrados, sem repetir, para sugerir no formulário. */
export function clientesConhecidos(agendamentos: Agendamento[]): string[] {
  const vistos = new Map<string, string>()
  for (const a of agendamentos) {
    const nome = a.cliente.trim()
    if (nome && !vistos.has(nome.toLowerCase())) vistos.set(nome.toLowerCase(), nome)
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export const ROTULO_STATUS: Record<StatusExibido, string> = {
  agendado: 'Agendado',
  retirado: 'Em posse',
  devolvido: 'Devolvido',
  atrasado: 'Atrasado',
}
