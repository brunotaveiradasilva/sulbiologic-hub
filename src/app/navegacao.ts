/** Subabas da área de Metas — aparecem no menu lateral e, no celular, como abas no topo da página. */
export type SubabaMetas = 'porRepresentante' | 'porFornecedor'

export const SUBABAS_METAS: { valor: SubabaMetas; rotulo: string }[] = [
  { valor: 'porRepresentante', rotulo: 'Meta Representante' },
  { valor: 'porFornecedor', rotulo: 'Meta Fornecedor' },
]

/** Subabas da área de Campanhas. */
export type SubabaCampanhas = 'especialistaPet' | 'wellpet' | 'organnact'

export const SUBABAS_CAMPANHAS: { valor: SubabaCampanhas; rotulo: string }[] = [
  { valor: 'especialistaPet', rotulo: 'Especialista Pet' },
  { valor: 'wellpet', rotulo: 'Positivação Wellpet' },
  { valor: 'organnact', rotulo: 'Positivação Organnact' },
]

/** Subabas da área de Dados. */
export type SubabaDados = 'comparativo'

export const SUBABAS_DADOS: { valor: SubabaDados; rotulo: string }[] = [
  { valor: 'comparativo', rotulo: 'Comparativo de vendas' },
]

/** Subabas da área de Cadastros: tudo o que se cadastra no sistema fica junto aqui. */
export type SubabaCadastros = 'fornecedores' | 'representantes' | 'metas' | 'usuarios'

const SUBABAS_CADASTROS: { valor: SubabaCadastros; rotulo: string }[] = [
  { valor: 'fornecedores', rotulo: 'Fornecedores' },
  { valor: 'representantes', rotulo: 'Representantes' },
  { valor: 'metas', rotulo: 'Metas' },
  { valor: 'usuarios', rotulo: 'Usuários' },
]

/**
 * Cadastros é só do admin (os materiais saíram pro Retira). Lista vazia = a pessoa não vê a seção.
 */
export function subabasCadastros(isAdmin: boolean) {
  return isAdmin ? SUBABAS_CADASTROS : []
}
