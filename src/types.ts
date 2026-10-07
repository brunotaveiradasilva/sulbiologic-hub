/**
 * Nível de acesso do login. ADMIN gerencia tudo; SUPERVISOR consulta metas e campanhas de todos os
 * representantes; REPRESENTANTE consulta só as dele; USUARIO só o almoxarifado. Supervisor e
 * representante não editam nada — e quem filtra o que o representante enxerga é a API.
 */
export type Role = 'ADMIN' | 'SUPERVISOR' | 'REPRESENTANTE' | 'USUARIO'

/** Um login como a tela de Usuários mostra. representanteNome só vem pra REPRESENTANTE. */
export interface UsuarioResumo {
  usuario: string
  role: Role
  representanteId?: string | null
  representanteNome?: string | null
  /** Dados da pessoa — opcionais (logins antigos não têm). */
  nome?: string | null
  sobrenome?: string | null
  email?: string | null
  /** AAAA-MM-DD */
  dataNascimento?: string | null
}

/** Status guardado no agendamento. */
export type Status = 'agendado' | 'retirado' | 'devolvido'

/** Status mostrado na tela — inclui "atrasado", que é calculado a partir da data. */
export type StatusExibido = Status | 'atrasado'

export interface Material {
  id: string
  nome: string
  codigo: string
  /** Quantidade total que existe no almoxarifado. */
  estoque: number
  obs: string
}

export interface Agendamento {
  id: string
  materialId: string
  qtd: number
  responsavel: string
  /** Cliente para quem o material vai. Vazio em retiradas de uso interno. */
  cliente: string
  /** Data no formato ISO (AAAA-MM-DD). */
  retirada: string
  /** Data no formato ISO (AAAA-MM-DD). */
  devolucao: string
  status: Status
  obs: string
}

export interface Fornecedor {
  id: string
  nome: string
}

export interface Representante {
  id: string
  nome: string
  /** Um representante pode trabalhar para mais de um fornecedor. */
  fornecedores: Fornecedor[]
  email: string
  celular: string
  /** Código desse representante na API da ADS (histórico de vendas) — vazio se ele não é sincronizado automaticamente. */
  codigoAds: string
  /** Total vendido em R$ no mês corrente, somando todos os fornecedores/divisões (não só o que está mapeado em alguma meta). Null se nunca foi sincronizado. */
  totalVendidoAds: number | null
}

/** Como uma meta é medida. CLIENTES é positivação: quantos clientes diferentes compraram no mês. */
export type UnidadeMeta = 'KG' | 'UNIDADE' | 'REAL' | 'CLIENTES'

export interface Meta {
  id: string
  nome: string
  /** Uma meta pertence a um único fornecedor. */
  fornecedor: Fornecedor
  unidade: UnidadeMeta
  /** Código (ou vários, separados por vírgula) da divisão correspondente na API da ADS — ignorado se cnpjAdsFornecedor estiver preenchido. */
  codigoAdsDivisao: string
  /** CNPJ do fornecedor na API da ADS — soma tudo vendido dele, sem filtrar por divisão. Tem prioridade sobre codigoAdsDivisao. */
  cnpjAdsFornecedor: string
  /** Produtos que não contam pra meta, separados por vírgula: código do produto na ADS ("5085") ou trecho do nome ("WELLPET"). Null em metas antigas. */
  produtosExcluidos: string | null
  /** Se preenchido, só esses produtos contam pra meta — mesmo formato de produtosExcluidos. Null em metas antigas. */
  produtosIncluidos: string | null
  /** Posição nas listas da tela (0 primeiro). A API já devolve as metas nessa ordem; null em metas antigas, que vão pro fim. */
  ordem: number | null
  /** Texto livre explicando a meta. Null se não tiver. */
  descricao: string | null
  /**
   * Período da meta dentro do mês, em dias (ex.: 1 a 19): só as vendas faturadas nesses dias contam.
   * Os dois null = mês inteiro. Fim 31 num mês de 30 dias vale até o último dia.
   */
  diaInicio: number | null
  diaFim: number | null
  /**
   * Meta guardada só pelo histórico (ex.: uma que valeu só em setembro): nas consultas só aparece nos meses
   * em que tem valor de meta, e não é copiada pro mês seguinte.
   */
  oculta: boolean
}

/** O valor de uma meta atribuído a um representante num mês: quanto ele precisa bater e quanto já bateu. */
export interface MetaRepresentante {
  id: string
  representante: Representante
  meta: Meta
  /** Mês de referência, "2026-09" — a meta pode mudar de um mês pro outro. */
  mes: string
  valorMeta: number
  /** Só chega pela sincronização com a ADS; não é editável. */
  valorRealizado: number
  /** Só em metas KG: quanto o realizado deu em R$. Null nas outras unidades e antes de sincronizar. */
  realizadoEmReais: number | null
}

/** Tudo que um representante vendeu num mês, de todos os fornecedores (card "Total vendido"). */
export interface TotalVendidoMensal {
  id: string
  representanteId: string
  mes: string
  total: number
}

/**
 * Um cliente da campanha Especialista Pet (PremieR) num mês. Metas em kg vêm da planilha da PremieR;
 * o realizado vem da sincronização com a ADS.
 */
export interface ClienteEspecialistaPet {
  id: string
  /** "2026-09" */
  mes: string
  /** Id do cliente na ADS (coluna CÓDIGO da planilha). */
  codigoCliente: string
  nome: string
  /** Nome como veio na coluna VENDEDOR da planilha — não é ligado ao cadastro de representantes. */
  representante: string
  /** "NUMÉRICA" ou "PONDERADA" — define a faixa de desconto. */
  classificacao: string
  /** Produto foco (NATTU), em kg. */
  metaFoco: number
  /** Todos os SKUs PremieR, em kg. */
  metaTotal: number
  realizadoFoco: number
  realizadoTotal: number
  /** Todos os SKUs em R$ a preço de tabela (sem desconto), incluindo o produto foco. */
  realizadoReais: number
  /** Só o produto foco em R$ a preço de tabela — parte de realizadoReais. */
  realizadoFocoReais: number
  /** Só a linha NATTU WILD, em kg — parte de realizadoFoco. */
  realizadoFocoWild: number
}

/**
 * Um cliente da campanha de positivação Wellpet num mês: da carteira de um representante (comprou com
 * ele nos 12 meses antes) e sem nenhuma compra de Wellpet desde o lançamento (set/2025). A lista é
 * montada a partir da ADS; o Wellpet comprado no mês vem da sincronização.
 */
export interface ClienteCampanhaWellpet {
  id: string
  /** Mês da campanha, "2026-10". */
  mes: string
  /** Id do cliente na ADS. */
  codigoCliente: string
  nome: string
  cnpjCpf: string
  /** Segmento na ADS, ex.: "VETERINARIOS". */
  segmento: string
  /** Código do representante na ADS ("003"). */
  representanteCodigoAds: string
  /** Nome do representante como vem da ADS — o da última compra do cliente. */
  representante: string
  /** "2026-09-10": última compra com esse representante antes da campanha. */
  ultimaCompra: string | null
  /** Wellpet no mês da campanha (venda menos devolução). */
  wellpetReais: number
  wellpetUnidades: number
  /** "2026-10-03"; null enquanto não positivou. */
  primeiraCompraWellpet: string | null
  /** Comprou Wellpet no mês (saldo em R$ acima de zero). */
  positivado: boolean
}

export interface Dados {
  materiais: Material[]
  agendamentos: Agendamento[]
}

export interface Resumo {
  retiradasHoje: number
  devolucoesHoje: number
  emPosse: number
  atrasados: number
}

/** Filtro da lista de agendamentos. */
export type Filtro = 'todos' | StatusExibido

/** Vendas menos devoluções num período, sem bonificação — mesma regra do realizado das metas. */
export interface ValoresVenda {
  /** R$ do produto. */
  valor: number
  /** Peso bruto. */
  kg: number
  /** Clientes diferentes com saldo positivo em R$. */
  clientes: number
}

/** Quanto foi vendido num período (aba Dados), direto da ADS — não depende do que foi sincronizado nas metas. */
export interface VendasPeriodo {
  /** AAAA-MM-DD */
  inicio: string
  /** AAAA-MM-DD */
  fim: string
  /** Um por representante do cadastro com código ADS (ou só o escolhido), mesmo sem venda. */
  representantes: {
    codigoAds: string
    /** Id no cadastro — é por ele que os dois períodos se casam. */
    representanteId: string
    nome: string
    valores: ValoresVenda
  }[]
  /** Os clientes do total não se repetem: não é a soma dos clientes de cada representante. */
  total: ValoresVenda
}
