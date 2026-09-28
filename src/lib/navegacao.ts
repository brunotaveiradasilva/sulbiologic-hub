/** Subabas da área de Materiais — aparecem no menu lateral e, no celular, como abas no topo da página. */
export type SubabaMateriais = 'agendamentos' | 'cadastro'

export const SUBABAS_MATERIAIS: { valor: SubabaMateriais; rotulo: string }[] = [
  { valor: 'agendamentos', rotulo: 'Agendamentos' },
  { valor: 'cadastro', rotulo: 'Cadastro' },
]

/** Subabas da área de Metas. */
export type SubabaMetas = 'fornecedores' | 'representantes' | 'metas' | 'porRepresentante' | 'porFornecedor'

const SUBABAS_METAS: { valor: SubabaMetas; rotulo: string }[] = [
  { valor: 'fornecedores', rotulo: 'Fornecedores' },
  { valor: 'representantes', rotulo: 'Representantes' },
  { valor: 'metas', rotulo: 'Metas' },
  { valor: 'porRepresentante', rotulo: 'Meta Representante' },
  { valor: 'porFornecedor', rotulo: 'Meta Fornecedor' },
]

/** Supervisor e representante só têm as telas de consulta — os cadastros são do admin. */
export function subabasMetas(isAdmin: boolean) {
  return isAdmin ? SUBABAS_METAS : SUBABAS_METAS.filter((s) => s.valor === 'porRepresentante' || s.valor === 'porFornecedor')
}

/** Subabas da área de Campanhas. */
export type SubabaCampanhas = 'especialistaPet'

export const SUBABAS_CAMPANHAS: { valor: SubabaCampanhas; rotulo: string }[] = [
  { valor: 'especialistaPet', rotulo: 'Especialista Pet' },
]

/** Subabas da área de Dados. */
export type SubabaDados = 'comparativo'

export const SUBABAS_DADOS: { valor: SubabaDados; rotulo: string }[] = [
  { valor: 'comparativo', rotulo: 'Comparativo de vendas' },
]
