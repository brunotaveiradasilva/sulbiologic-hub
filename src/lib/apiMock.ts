import { diasEntre, somarDias } from './datas'
import { mesAtual, mesFechado, somarMeses } from './mes'
import type { DadosUsuario } from './api'
import type {
  Agendamento,
  ClienteCampanhaWellpet,
  ClienteEspecialistaPet,
  Fornecedor,
  Material,
  Meta,
  MetaRepresentante,
  Representante,
  Role,
  Status,
  TotalVendidoMensal,
  UnidadeMeta,
  UsuarioResumo,
  VendasPeriodo,
} from '../types'

/**
 * Backend falso, só em memória, usado quando VITE_MOCK_API=true (sem precisar da almoxarifado-api
 * nem de Docker rodando). Login aceita qualquer usuário/senha como ADMIN. Dados somem ao recarregar
 * a página — é só pra ver a interface funcionando com dados de exemplo.
 */

let contador = 0
function novoId(prefixo: string): string {
  contador += 1
  return `${prefixo}-${contador}`
}

function achar<T extends { id: string }>(lista: T[], id: string): T {
  const item = lista.find((i) => i.id === id)
  if (!item) throw new Error(`mock: id "${id}" não encontrado`)
  return item
}

let avatar: string | null = null
let usuarios: UsuarioResumo[] = [{ usuario: 'admin', role: 'ADMIN' }]

let materiais: Material[] = [
  { id: novoId('mat'), nome: 'Furadeira de impacto', codigo: 'FER-014', estoque: 3, obs: 'Maleta com brocas no armário 2.' },
  { id: novoId('mat'), nome: 'Projetor multimídia', codigo: 'AUD-002', estoque: 2, obs: 'Acompanha cabo HDMI e controle.' },
  { id: novoId('mat'), nome: 'Escada de alumínio 6 degraus', codigo: 'EST-007', estoque: 4, obs: '' },
]

let agendamentos: Agendamento[] = [
  {
    id: novoId('age'),
    materialId: materiais[1].id,
    qtd: 1,
    responsavel: 'Marina Alves',
    cliente: 'Colégio Santa Cruz',
    retirada: somarDias(-6),
    devolucao: somarDias(-2),
    status: 'retirado',
    obs: 'Treinamento na sala 3.',
  },
  {
    id: novoId('age'),
    materialId: materiais[0].id,
    qtd: 1,
    responsavel: 'Carlos Prado',
    cliente: 'Construtora Vale Verde',
    retirada: somarDias(0),
    devolucao: somarDias(2),
    status: 'agendado',
    obs: 'Instalação das prateleiras.',
  },
  {
    id: novoId('age'),
    materialId: materiais[2].id,
    qtd: 2,
    responsavel: 'Equipe de manutenção',
    cliente: '',
    retirada: somarDias(1),
    devolucao: somarDias(4),
    status: 'agendado',
    obs: 'Uso interno.',
  },
  {
    id: novoId('age'),
    materialId: materiais[1].id,
    qtd: 1,
    responsavel: 'Júlia Ferraz',
    cliente: 'Colégio Santa Cruz',
    retirada: somarDias(-12),
    devolucao: somarDias(-9),
    status: 'devolvido',
    obs: 'Devolvido sem o controle; reposto depois.',
  },
]

let fornecedores: Fornecedor[] = [
  { id: novoId('for'), nome: 'Vetnil' },
  { id: novoId('for'), nome: 'Ceva Saúde Animal' },
]

let representantes: Representante[] = [
  { id: novoId('rep'), nome: 'Marina Alves', fornecedores: [fornecedores[0]], email: 'marina@exemplo.com', celular: '(11) 99999-0001', codigoAds: '003', totalVendidoAds: null },
  { id: novoId('rep'), nome: 'Carlos Prado', fornecedores: [fornecedores[0], fornecedores[1]], email: 'carlos@exemplo.com', celular: '(11) 99999-0002', codigoAds: '007', totalVendidoAds: null },
]

let metas: Meta[] = [
  { id: novoId('met'), nome: 'Vacina V10', fornecedor: fornecedores[0], unidade: 'UNIDADE', codigoAdsDivisao: '', cnpjAdsFornecedor: '', produtosExcluidos: '', produtosIncluidos: '', ordem: 0, descricao: null, diaInicio: null, diaFim: null, oculta: false },
  { id: novoId('met'), nome: 'Faturamento trimestral', fornecedor: fornecedores[1], unidade: 'REAL', codigoAdsDivisao: '', cnpjAdsFornecedor: '', produtosExcluidos: '', produtosIncluidos: '', ordem: 1, descricao: null, diaInicio: null, diaFim: null, oculta: false },
  { id: novoId('met'), nome: 'Ração Premium', fornecedor: fornecedores[0], unidade: 'KG', codigoAdsDivisao: '', cnpjAdsFornecedor: '', produtosExcluidos: '', produtosIncluidos: '', ordem: 2, descricao: null, diaInicio: null, diaFim: null, oculta: false },
]

// Mês atual e o anterior, pra dar pra testar o filtro de mês e o "copiar do mês anterior".
const MES_ATUAL = mesAtual()
const MES_ANTERIOR = somarMeses(MES_ATUAL, -1)

let metasRepresentante: MetaRepresentante[] = [
  { id: novoId('mrp'), representante: representantes[0], meta: metas[0], mes: MES_ATUAL, valorMeta: 500, valorRealizado: 320, realizadoEmReais: null },
  { id: novoId('mrp'), representante: representantes[1], meta: metas[1], mes: MES_ATUAL, valorMeta: 80000, valorRealizado: 54000, realizadoEmReais: null },
  { id: novoId('mrp'), representante: representantes[1], meta: metas[2], mes: MES_ATUAL, valorMeta: 34000, valorRealizado: 12480.5, realizadoEmReais: 61250.9 },
  { id: novoId('mrp'), representante: representantes[0], meta: metas[0], mes: MES_ANTERIOR, valorMeta: 450, valorRealizado: 470, realizadoEmReais: null },
  { id: novoId('mrp'), representante: representantes[1], meta: metas[0], mes: MES_ANTERIOR, valorMeta: 300, valorRealizado: 210, realizadoEmReais: null },
  { id: novoId('mrp'), representante: representantes[1], meta: metas[1], mes: MES_ANTERIOR, valorMeta: 75000, valorRealizado: 81200, realizadoEmReais: null },
]

const totaisVendidos: TotalVendidoMensal[] = [
  { id: novoId('tvm'), representanteId: representantes[0].id, mes: MES_ATUAL, total: 98021.64 },
  { id: novoId('tvm'), representanteId: representantes[0].id, mes: MES_ANTERIOR, total: 112430.1 },
  { id: novoId('tvm'), representanteId: representantes[1].id, mes: MES_ANTERIOR, total: 87311.9 },
]

/** Entra com o perfil do login cadastrado (ADMIN se ele não existe). O mock não filtra os dados por representante. */
export function login(usuario: string): Promise<{ token: string; usuario: string; role: Role; avatar: string | null }> {
  const nome = usuario.trim() || 'admin'
  const role = usuarios.find((u) => u.usuario.toLowerCase() === nome.toLowerCase())?.role ?? 'ADMIN'
  return Promise.resolve({ token: 'mock-token', usuario: nome, role, avatar })
}

function comRepresentante(u: UsuarioResumo): UsuarioResumo {
  return { ...u, representanteNome: representantes.find((r) => r.id === u.representanteId)?.nome ?? null }
}

function aplicarDados(usuario: string, dados: DadosUsuario): UsuarioResumo {
  return {
    usuario,
    ...dados,
    representanteId: dados.role === 'REPRESENTANTE' ? dados.representanteId : null,
    nome: dados.nome.trim() || null,
    sobrenome: dados.sobrenome.trim() || null,
    email: dados.email.trim() || null,
  }
}

export function listarUsuarios(): Promise<UsuarioResumo[]> {
  return Promise.resolve(usuarios.map(comRepresentante))
}

export function criarUsuario(usuario: string, dados: DadosUsuario): Promise<void> {
  usuarios = [...usuarios, aplicarDados(usuario, dados)]
  return Promise.resolve()
}

export function atualizarUsuario(usuario: string, dados: DadosUsuario): Promise<UsuarioResumo> {
  const atualizado = aplicarDados(usuario, dados)
  usuarios = usuarios.map((u) => (u.usuario === usuario ? atualizado : u))
  return Promise.resolve(comRepresentante(atualizado))
}

export function excluirUsuario(usuario: string): Promise<void> {
  usuarios = usuarios.filter((u) => u.usuario !== usuario)
  return Promise.resolve()
}

export function trocarSenha(): Promise<void> {
  return Promise.resolve()
}

export function atualizarAvatar(novoAvatar: string | null): Promise<void> {
  avatar = novoAvatar
  return Promise.resolve()
}

export function listarMateriais(): Promise<Material[]> {
  return Promise.resolve(materiais)
}

export function criarMaterial(material: Omit<Material, 'id'>): Promise<Material> {
  const novo = { ...material, id: novoId('mat') }
  materiais = [...materiais, novo]
  return Promise.resolve(novo)
}

export function atualizarMaterial(id: string, material: Omit<Material, 'id'>): Promise<Material> {
  const atualizado = { ...material, id }
  materiais = materiais.map((m) => (m.id === id ? atualizado : m))
  return Promise.resolve(atualizado)
}

export function excluirMaterial(id: string): Promise<void> {
  materiais = materiais.filter((m) => m.id !== id)
  return Promise.resolve()
}

export function listarAgendamentos(): Promise<Agendamento[]> {
  return Promise.resolve(agendamentos)
}

export function criarAgendamento(agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
  const novo = { ...agendamento, id: novoId('age') }
  agendamentos = [...agendamentos, novo]
  return Promise.resolve(novo)
}

export function atualizarAgendamento(id: string, agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
  const atualizado = { ...agendamento, id }
  agendamentos = agendamentos.map((a) => (a.id === id ? atualizado : a))
  return Promise.resolve(atualizado)
}

export function definirStatusAgendamento(id: string, status: Status): Promise<Agendamento> {
  const atualizado = { ...achar(agendamentos, id), status }
  agendamentos = agendamentos.map((a) => (a.id === id ? atualizado : a))
  return Promise.resolve(atualizado)
}

export function excluirAgendamento(id: string): Promise<void> {
  agendamentos = agendamentos.filter((a) => a.id !== id)
  return Promise.resolve()
}

export function listarFornecedores(): Promise<Fornecedor[]> {
  return Promise.resolve(fornecedores)
}

export function criarFornecedor(fornecedor: Omit<Fornecedor, 'id'>): Promise<Fornecedor> {
  const novo = { ...fornecedor, id: novoId('for') }
  fornecedores = [...fornecedores, novo]
  return Promise.resolve(novo)
}

export function atualizarFornecedor(id: string, fornecedor: Omit<Fornecedor, 'id'>): Promise<Fornecedor> {
  const atualizado = { ...fornecedor, id }
  fornecedores = fornecedores.map((f) => (f.id === id ? atualizado : f))
  return Promise.resolve(atualizado)
}

export function excluirFornecedor(id: string): Promise<void> {
  fornecedores = fornecedores.filter((f) => f.id !== id)
  return Promise.resolve()
}

interface RepresentanteEntradaMock {
  nome: string
  fornecedorIds: string[]
  email: string
  celular: string
  codigoAds: string
}

export function listarRepresentantes(): Promise<Representante[]> {
  return Promise.resolve(representantes)
}

export function criarRepresentante(representante: RepresentanteEntradaMock): Promise<Representante> {
  const novo: Representante = {
    id: novoId('rep'),
    nome: representante.nome,
    email: representante.email,
    celular: representante.celular,
    codigoAds: representante.codigoAds,
    totalVendidoAds: null,
    fornecedores: fornecedores.filter((f) => representante.fornecedorIds.includes(f.id)),
  }
  representantes = [...representantes, novo]
  return Promise.resolve(novo)
}

export function atualizarRepresentante(id: string, representante: RepresentanteEntradaMock): Promise<Representante> {
  const atualizado: Representante = {
    id,
    nome: representante.nome,
    email: representante.email,
    celular: representante.celular,
    codigoAds: representante.codigoAds,
    totalVendidoAds: achar(representantes, id).totalVendidoAds,
    fornecedores: fornecedores.filter((f) => representante.fornecedorIds.includes(f.id)),
  }
  representantes = representantes.map((r) => (r.id === id ? atualizado : r))
  return Promise.resolve(atualizado)
}

export function excluirRepresentante(id: string): Promise<void> {
  representantes = representantes.filter((r) => r.id !== id)
  return Promise.resolve()
}

interface MetaEntradaMock {
  nome: string
  fornecedorId: string
  unidade: UnidadeMeta
  codigoAdsDivisao: string
  cnpjAdsFornecedor: string
  produtosExcluidos: string
  produtosIncluidos: string
  descricao: string
  diaInicio: number | null
  diaFim: number | null
}

export function listarMetas(): Promise<Meta[]> {
  return Promise.resolve(metas)
}

export function criarMeta(meta: MetaEntradaMock): Promise<Meta> {
  const novo: Meta = {
    id: novoId('met'),
    nome: meta.nome,
    unidade: meta.unidade,
    codigoAdsDivisao: meta.codigoAdsDivisao,
    cnpjAdsFornecedor: meta.cnpjAdsFornecedor,
    produtosExcluidos: meta.produtosExcluidos,
    produtosIncluidos: meta.produtosIncluidos,
    descricao: meta.descricao.trim() || null,
    diaInicio: meta.diaInicio,
    diaFim: meta.diaFim,
    ordem: metas.length,
    oculta: false,
    fornecedor: achar(fornecedores, meta.fornecedorId),
  }
  metas = [...metas, novo]
  return Promise.resolve(novo)
}

export function atualizarMeta(id: string, meta: MetaEntradaMock): Promise<Meta> {
  const atualizado: Meta = {
    id,
    nome: meta.nome,
    unidade: meta.unidade,
    codigoAdsDivisao: meta.codigoAdsDivisao,
    cnpjAdsFornecedor: meta.cnpjAdsFornecedor,
    produtosExcluidos: meta.produtosExcluidos,
    produtosIncluidos: meta.produtosIncluidos,
    descricao: meta.descricao.trim() || null,
    diaInicio: meta.diaInicio,
    diaFim: meta.diaFim,
    ordem: metas.find((m) => m.id === id)?.ordem ?? null,
    oculta: metas.find((m) => m.id === id)?.oculta ?? false,
    fornecedor: achar(fornecedores, meta.fornecedorId),
  }
  metas = metas.map((m) => (m.id === id ? atualizado : m))
  return Promise.resolve(atualizado)
}

export function excluirMeta(id: string): Promise<void> {
  metas = metas.filter((m) => m.id !== id)
  return Promise.resolve()
}

export function ocultarMeta(id: string, oculta: boolean): Promise<Meta> {
  metas = metas.map((m) => (m.id === id ? { ...m, oculta } : m))
  return Promise.resolve(achar(metas, id))
}

/** Mesma regra da API: as da lista na ordem dela, as que faltarem no fim. */
export function ordenarMetas(ids: string[]): Promise<Meta[]> {
  const naLista = ids.map((id) => metas.find((m) => m.id === id)).filter((m): m is Meta => !!m)
  const resto = metas.filter((m) => !ids.includes(m.id))
  metas = [...naLista, ...resto].map((m, i) => ({ ...m, ordem: i }))
  return Promise.resolve(metas)
}

interface MetaRepresentanteEntradaMock {
  representanteId: string
  metaId: string
  mes: string
  valorMeta: number
}

export function listarMetasRepresentante(): Promise<MetaRepresentante[]> {
  return Promise.resolve(metasRepresentante)
}

export function listarTotaisVendidos(): Promise<TotalVendidoMensal[]> {
  return Promise.resolve(totaisVendidos)
}

/** Como a API: mês que já acabou não aceita mais mudança de meta. */
function recusarSeFechado(mes: string): Promise<never> | null {
  return mesFechado(mes) ? Promise.reject(new Error(`mock: o mês ${mes} já fechou`)) : null
}

export function criarMetaRepresentante(mv: MetaRepresentanteEntradaMock): Promise<MetaRepresentante> {
  const fechado = recusarSeFechado(mv.mes)
  if (fechado) return fechado
  const novo: MetaRepresentante = {
    id: novoId('mrp'),
    representante: achar(representantes, mv.representanteId),
    meta: achar(metas, mv.metaId),
    mes: mv.mes,
    valorMeta: mv.valorMeta,
    valorRealizado: 0,
    realizadoEmReais: null,
  }
  metasRepresentante = [...metasRepresentante, novo]
  return Promise.resolve(novo)
}

/** Como a API: troca só o valor da meta, o realizado fica como está. */
export function atualizarMetaRepresentante(id: string, mv: MetaRepresentanteEntradaMock): Promise<MetaRepresentante> {
  const fechado = recusarSeFechado(achar(metasRepresentante, id).mes) ?? recusarSeFechado(mv.mes)
  if (fechado) return fechado
  const atualizado: MetaRepresentante = {
    ...achar(metasRepresentante, id),
    representante: achar(representantes, mv.representanteId),
    meta: achar(metas, mv.metaId),
    mes: mv.mes,
    valorMeta: mv.valorMeta,
  }
  metasRepresentante = metasRepresentante.map((m) => (m.id === id ? atualizado : m))
  return Promise.resolve(atualizado)
}

/**
 * Como a API: copia só o que o mês de destino ainda não tem (a linha "sem meta", valor 0, conta como vazia e
 * ganha o valor, mantendo o realizado); o que não existia entra com realizado zerado.
 */
export function copiarMetasRepresentante(de: string, para: string, fornecedorId?: string): Promise<MetaRepresentante[]> {
  const fechado = recusarSeFechado(para)
  if (fechado) return fechado
  const copiadas: MetaRepresentante[] = []
  for (const m of metasRepresentante) {
    if (m.mes !== de || m.valorMeta <= 0 || (fornecedorId && m.meta.fornecedor.id !== fornecedorId)) continue
    const destino = metasRepresentante.find(
      (outra) => outra.mes === para && outra.representante.id === m.representante.id && outra.meta.id === m.meta.id,
    )
    if (destino && destino.valorMeta > 0) continue
    copiadas.push(
      destino
        ? { ...destino, valorMeta: m.valorMeta }
        : { ...m, id: novoId('mrp'), mes: para, valorRealizado: 0, realizadoEmReais: null },
    )
  }
  const porId = new Map(copiadas.map((m) => [m.id, m]))
  metasRepresentante = [
    ...metasRepresentante.map((m) => porId.get(m.id) ?? m),
    ...copiadas.filter((c) => !metasRepresentante.some((m) => m.id === c.id)),
  ]
  return Promise.resolve(copiadas)
}

export function excluirMetaRepresentante(id: string): Promise<void> {
  metasRepresentante = metasRepresentante.filter((m) => m.id !== id)
  return Promise.resolve()
}

/**
 * No mock não tem ADS de verdade pra consultar — mantém o realizado de quem já tem, e como a API cria a linha
 * "sem meta" (valor 0) com um realizado inventado pras metas dos fornecedores de cada representante que ainda
 * não têm valor no mês.
 */
export function sincronizarMetasRepresentante(mes: string): Promise<MetaRepresentante[]> {
  const novas: MetaRepresentante[] = []
  for (const representante of representantes) {
    for (const meta of metas) {
      if (!representante.fornecedores.some((f) => f.id === meta.fornecedor.id)) continue
      const jaTem = metasRepresentante.some(
        (m) => m.mes === mes && m.representante.id === representante.id && m.meta.id === meta.id,
      )
      if (jaTem) continue
      const realizado = meta.unidade === 'REAL' ? Math.round(Math.random() * 40000) : Math.round(Math.random() * 400)
      novas.push({
        id: novoId('mrp'),
        representante,
        meta,
        mes,
        valorMeta: 0,
        valorRealizado: realizado,
        realizadoEmReais: meta.unidade === 'KG' ? realizado * 5 : null,
      })
    }
  }
  metasRepresentante = [...metasRepresentante, ...novas]
  // Demora um pouco, como a ADS de verdade, pra dar pra ver o carregamento da tela.
  return new Promise((ok) => setTimeout(() => ok(metasRepresentante.filter((m) => m.mes === mes)), 1500))
}

let especialistaPet: ClienteEspecialistaPet[] = []

export function listarEspecialistaPet(): Promise<ClienteEspecialistaPet[]> {
  return Promise.resolve(especialistaPet)
}

/** Como a API: a planilha nova substitui o mês inteiro, com realizado zerado. */
export function importarEspecialistaPet(
  mes: string,
  clientes: Omit<ClienteEspecialistaPet, 'id' | 'mes' | 'realizadoFoco' | 'realizadoTotal' | 'realizadoReais' | 'realizadoFocoReais' | 'realizadoFocoWild'>[],
): Promise<ClienteEspecialistaPet[]> {
  const novos = clientes.map((c) => ({
    ...c,
    id: novoId('esp'),
    mes,
    realizadoFoco: 0,
    realizadoTotal: 0,
    realizadoReais: 0,
    realizadoFocoReais: 0,
    realizadoFocoWild: 0,
  }))
  especialistaPet = [...especialistaPet.filter((c) => c.mes !== mes), ...novos]
  return Promise.resolve(novos)
}

/** Sem ADS no mock: inventa um realizado em volta da meta, pra dar pra ver as barras e o desconto. */
export function sincronizarEspecialistaPet(mes: string): Promise<ClienteEspecialistaPet[]> {
  especialistaPet = especialistaPet.map((c) => {
    if (c.mes !== mes) return c
    const realizadoTotal = Math.round(c.metaTotal * Math.random() * 1.6 * 10) / 10
    const realizadoFoco = Math.round(c.metaFoco * Math.random() * 1.6 * 10) / 10
    return {
      ...c,
      realizadoFoco,
      realizadoFocoReais: Math.round(realizadoFoco * 20 * 100) / 100,
      realizadoFocoWild: Math.round(realizadoFoco * Math.random() * 0.4 * 10) / 10,
      realizadoTotal,
      realizadoReais: Math.round((realizadoTotal * 15 + realizadoFoco * 20) * 100) / 100,
    }
  })
  // Demora uns segundos subindo o progresso, como a busca página a página na ADS de verdade.
  progressoEspecialistaPet.set(mes, 0)
  return new Promise((ok) => {
    const passo = setInterval(() => {
      const atual = progressoEspecialistaPet.get(mes) ?? 0
      if (atual >= 99) {
        clearInterval(passo)
        progressoEspecialistaPet.delete(mes)
        ok(especialistaPet.filter((c) => c.mes === mes))
      } else {
        progressoEspecialistaPet.set(mes, Math.min(99, atual + 11))
      }
    }, 500)
  })
}

const progressoEspecialistaPet = new Map<string, number>()

export function progressoSincronizacaoEspecialistaPet(mes: string): Promise<number | null> {
  return Promise.resolve(progressoEspecialistaPet.get(mes) ?? null)
}

let campanhaWellpet: ClienteCampanhaWellpet[] = []
const progressoWellpet = new Map<string, number>()

export function listarCampanhaWellpet(): Promise<ClienteCampanhaWellpet[]> {
  return Promise.resolve(campanhaWellpet)
}

/** Sobe o progresso do mês até 99% em uns segundos, como a busca página a página na ADS de verdade. */
function demorarComProgresso<T>(mes: string, resultado: () => T): Promise<T> {
  progressoWellpet.set(mes, 0)
  return new Promise((ok) => {
    const passo = setInterval(() => {
      const atual = progressoWellpet.get(mes) ?? 0
      if (atual >= 99) {
        clearInterval(passo)
        progressoWellpet.delete(mes)
        ok(resultado())
      } else {
        progressoWellpet.set(mes, Math.min(99, atual + 11))
      }
    }, 400)
  })
}

/**
 * Sem ADS no mock: inventa a carteira sem Wellpet de três representantes. Como a API, volta na hora e
 * a lista só aparece quando o progresso termina.
 */
export function montarCampanhaWellpet(mes: string): Promise<void> {
  const representantes = [
    ['003', 'MARYE MOTA ZIRBES'],
    ['007', 'ANDRESSA LIMA'],
    ['012', 'ISABELLA ROCHA'],
  ]
  const segmentos = ['VETERINARIOS', 'PET SHOP', 'AGROPECUARIA']
  const novos = Array.from({ length: 42 }, (_, i): ClienteCampanhaWellpet => {
    const [codigo, nome] = representantes[i % representantes.length]
    return {
      id: novoId('wel'),
      mes,
      codigoCliente: String(6000 + i * 7),
      nome: `CLIENTE EXEMPLO ${i + 1}`,
      cnpjCpf: String(10000000000000 + i * 1234567),
      segmento: segmentos[i % segmentos.length],
      representanteCodigoAds: codigo,
      representante: nome,
      ultimaCompra: `${somarMeses(mes, -1 - (i % 5))}-${String(1 + (i % 27)).padStart(2, '0')}`,
      wellpetReais: 0,
      wellpetUnidades: 0,
      primeiraCompraWellpet: null,
      positivado: false,
    }
  })
  demorarComProgresso(mes, () => {
    campanhaWellpet = [...campanhaWellpet.filter((c) => c.mes !== mes), ...novos]
  })
  return Promise.resolve()
}

/** Uns 40% da lista compram Wellpet no mês. */
export function sincronizarCampanhaWellpet(mes: string): Promise<ClienteCampanhaWellpet[]> {
  campanhaWellpet = campanhaWellpet.map((c) => {
    if (c.mes !== mes) return c
    const comprou = sorteioFixo(c.codigoCliente + mes) < 0.4
    const unidades = comprou ? 1 + Math.floor(sorteioFixo(c.nome) * 6) : 0
    return {
      ...c,
      wellpetUnidades: unidades,
      wellpetReais: unidades * 89.9,
      primeiraCompraWellpet: comprou ? `${mes}-${String(1 + Math.floor(sorteioFixo(c.id) * 5)).padStart(2, '0')}` : null,
      positivado: comprou,
    }
  })
  return demorarComProgresso(mes, () => campanhaWellpet.filter((c) => c.mes === mes))
}

export function progressoCampanhaWellpet(mes: string): Promise<{ percentual: number | null; erro: string | null }> {
  return Promise.resolve({ percentual: progressoWellpet.get(mes) ?? null, erro: null })
}

/** Número entre 0 e 1 sempre igual pro mesmo texto — o mock devolve o mesmo resultado pro mesmo período. */
function sorteioFixo(texto: string): number {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

/**
 * Sem ADS no mock: soma dia a dia um valor inventado (mas fixo) por representante, crescendo um
 * pouco a cada ano, pra dar pra ver as comparações. Só representantes com código ADS, como a API.
 */
export function buscarVendasPeriodo(
  inicio: string,
  fim: string,
  { representanteIds = [], fornecedorIds = [] }: { representanteIds?: string[]; fornecedorIds?: string[] },
): Promise<VendasPeriodo> {
  const vendedores = representantes
    .filter((r) => r.codigoAds.trim() && (!representanteIds.length || representanteIds.includes(r.id)))
    .map((r) => ({ codigoAds: r.codigoAds, representanteId: r.id, nome: r.nome }))
  const fracaoFornecedor = fornecedorIds.length ? Math.min(1, fornecedorIds.reduce((s, id) => s + 0.35 + sorteioFixo(id) * 0.3, 0)) : 1
  const linhas = vendedores.map((v) => {
    let valor = 0
    for (let dia = inicio; dia <= fim; dia = somarDias(1, new Date(`${dia}T12:00:00`))) {
      const crescimento = 1 + (Number(dia.slice(0, 4)) - 2024) * 0.12
      valor += sorteioFixo(`${v.codigoAds}|${dia}`) * 4200 * crescimento * fracaoFornecedor
    }
    valor = Math.round(valor * 100) / 100
    const dias = diasEntre(inicio, fim) + 1
    return {
      ...v,
      valores: {
        valor,
        kg: Math.round((valor / 14) * 10) / 10,
        clientes: Math.round(Math.min(dias, 40) * (0.8 + sorteioFixo(`${v.codigoAds}|${inicio}|${fim}`) * 1.2) * fracaoFornecedor),
      },
    }
  })
  const total = linhas.reduce(
    (t, l) => ({ valor: t.valor + l.valores.valor, kg: t.kg + l.valores.kg, clientes: t.clientes + l.valores.clientes }),
    { valor: 0, kg: 0, clientes: 0 },
  )
  total.clientes = Math.round(total.clientes * 0.9) // um cliente pode comprar de dois representantes
  const resultado: VendasPeriodo = { inicio, fim, representantes: linhas.sort((a, b) => b.valores.valor - a.valores.valor), total }
  return new Promise((ok) => setTimeout(() => ok(resultado), 700))
}
