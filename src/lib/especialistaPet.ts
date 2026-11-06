import { unzipSync, strFromU8 } from 'fflate'
import type { LinhaPlanilhaEspecialistaPet } from './api'
import type { ClienteEspecialistaPet } from '../types'

/**
 * Campanha Especialista Pet (PremieR): leitura da planilha mensal "Acompanhamento - Especialista Pet"
 * e a regra de desconto que ela aplica.
 */

export interface DescontoEspecialistaPet {
  /** Produto foco em R$ (tabela) e o desconto sobre ele. */
  reaisFoco: number
  percentualFoco: number
  valorFoco: number
  /** Os outros SKUs PremieR em R$ (tabela) e o desconto sobre eles. */
  reaisSemFoco: number
  percentualSemFoco: number
  valorSemFoco: number
  /** Os dois descontos somados. */
  valor: number
}

/** Kg de todos os SKUs que vale pro cliente: o ajustado à mão, se tiver, senão o da ADS. */
export function realizadoTotalEfetivo(c: ClienteEspecialistaPet): number {
  return c.realizadoTotalAjustado ?? c.realizadoTotal
}

/** Desconto a mais no produto foco para quem comprou NATTU WILD no mês (Combo Wild). */
const BONUS_WILD = 7

/**
 * Desconto que o cliente conquista, sobre o realizado em R$ a preço de tabela (sem desconto), em duas
 * partes. A faixa da campanha: bater a meta de todos os SKUs dá 10% (numérica) ou 5% (ponderada);
 * bater também a do produto foco sobe pra 12% ou 6%. Sem bater todos os SKUs, nada.
 *
 * - Sem o produto foco: o R$ dos outros SKUs × a faixa.
 * - Produto foco: o R$ do foco × a faixa, só se bateu a meta de foco — senão 0%.
 * - Combo Wild: comprou qualquer coisa da linha NATTU WILD, ganha +7% no R$ do foco, somado ao que
 *   já tinha e independente das outras metas (ponderada 6% + 7% = 13%, numérica 12% + 7% = 19%).
 */
export function descontoEspecialistaPet(c: ClienteEspecialistaPet): DescontoEspecialistaPet {
  const bateuTotal = c.metaTotal > 0 && realizadoTotalEfetivo(c) >= c.metaTotal
  const bateuFoco = c.metaFoco > 0 && c.realizadoFoco >= c.metaFoco
  const ponderada = normalizar(c.classificacao) === 'PONDERADA'
  const numerica = normalizar(c.classificacao) === 'NUMERICA'
  let faixa = 0
  if (bateuTotal && (numerica || ponderada)) {
    faixa = numerica ? (bateuFoco ? 12 : 10) : bateuFoco ? 6 : 5
  }

  const reaisFoco = c.realizadoFocoReais ?? 0
  const reaisSemFoco = c.realizadoReais - reaisFoco
  const comprouWild = (c.realizadoFocoWild ?? 0) > 0
  const percentualFoco = (bateuFoco ? faixa : 0) + (comprouWild ? BONUS_WILD : 0)
  const valorFoco = (reaisFoco * percentualFoco) / 100
  const valorSemFoco = (reaisSemFoco * faixa) / 100
  return {
    reaisFoco,
    percentualFoco,
    valorFoco,
    reaisSemFoco,
    percentualSemFoco: faixa,
    valorSemFoco,
    valor: valorFoco + valorSemFoco,
  }
}

/** "Acompanhamento - Especialista Pet - 09.2026 - ..." -> "2026-09". Null se o nome não tem o mês. */
export function mesDoNomeDaPlanilha(nome: string): string | null {
  const m = /(\d{2})[.\-_/](\d{4})/.exec(nome)
  if (!m || +m[1] < 1 || +m[1] > 12) return null
  return `${m[2]}-${m[1]}`
}

/**
 * Lê a aba CNPJ da planilha da PremieR: uma linha por cliente, com o cabeçalho na linha que tem
 * VENDEDOR e o jeito de identificar o cliente — CÓDIGO (id da ADS) e/ou IDCLIENTE (o CNPJ). Desde
 * outubro/2026 a planilha só traz o IDCLIENTE; aí a API acha o código pelo CNPJ no cadastro da ADS.
 *
 * Das duas colunas "META MÊS CAMPANHA (KG)", a do produto foco é a que está embaixo do grupo
 * "PRODUTO FOCO" (na linha acima do cabeçalho) — em setembro era a primeira, em outubro passou a ser a
 * segunda. Sem esse grupo, vale a ordem antiga: primeiro o foco, depois todos os SKUs.
 * Usa o valor já calculado de cada célula (o que o Excel mostra).
 */
export async function lerPlanilhaEspecialistaPet(arquivo: File): Promise<LinhaPlanilhaEspecialistaPet[]> {
  let arquivos: Record<string, Uint8Array>
  try {
    arquivos = unzipSync(new Uint8Array(await arquivo.arrayBuffer()))
  } catch {
    throw new Error('Esse arquivo não é uma planilha do Excel (.xlsx).')
  }
  const texto = (caminho: string) => (arquivos[caminho] ? strFromU8(arquivos[caminho]) : null)
  const xml = (conteudo: string) => new DOMParser().parseFromString(conteudo, 'application/xml')

  const compartilhadas = [...xml(texto('xl/sharedStrings.xml') ?? '<sst/>').getElementsByTagName('si')].map((si) =>
    [...si.getElementsByTagName('t')].map((t) => t.textContent ?? '').join(''),
  )

  for (const caminho of caminhosDasAbas(texto, xml)) {
    const conteudo = texto(caminho)
    if (!conteudo) continue
    const linhas = lerCelulas(xml(conteudo), compartilhadas)
    const cabecalho = linhas.findIndex(
      (l) => l.some((c) => COLUNAS_DO_CLIENTE.includes(normalizar(c))) && l.some((c) => normalizar(c) === 'VENDEDOR'),
    )
    if (cabecalho < 0) continue

    const titulos = linhas[cabecalho].map(normalizar)
    const coluna = (nome: string) => titulos.indexOf(nome)
    const [codigo, nome, vendedor, classificacao] = ['CODIGO', 'NOME', 'VENDEDOR', 'CLASSIFICACAO'].map(coluna)
    const documento = coluna('IDCLIENTE') >= 0 ? coluna('IDCLIENTE') : coluna('CNPJ')
    const metas = colunasDasMetas(titulos, linhas.slice(0, cabecalho))
    if (nome < 0 || !metas) {
      throw new Error('A aba de clientes não tem as colunas NOME e as duas METAS MÊS CAMPANHA (KG).')
    }

    const celula = (l: string[], i: number) => (i >= 0 ? (l[i] ?? '').trim() : '')
    const clientes = linhas
      .slice(cabecalho + 1)
      .filter((l) => celula(l, codigo) !== '' || celula(l, documento) !== '')
      .map((l) => ({
        ...(celula(l, codigo) ? { codigoCliente: celula(l, codigo) } : {}),
        ...(celula(l, documento) ? { cnpj: celula(l, documento) } : {}),
        nome: celula(l, nome),
        representante: celula(l, vendedor),
        classificacao: celula(l, classificacao),
        metaFoco: Number(l[metas.foco]) || 0,
        metaTotal: Number(l[metas.total]) || 0,
      }))
    if (!clientes.length) throw new Error('A planilha não tem nenhum cliente embaixo do cabeçalho.')
    return clientes
  }
  throw new Error('Não achei a aba de clientes (com as colunas CÓDIGO ou IDCLIENTE, e VENDEDOR) nessa planilha.')
}

/** Colunas que identificam o cliente: o código da ADS ou o CNPJ. */
const COLUNAS_DO_CLIENTE = ['CODIGO', 'IDCLIENTE', 'CNPJ']

/**
 * Qual das duas "META MÊS CAMPANHA (KG)" é a do produto foco e qual a de todos os SKUs, pelo grupo que
 * fica nas linhas acima do cabeçalho (cada grupo vale da coluna dele até o próximo, como célula mesclada).
 */
function colunasDasMetas(titulos: string[], acima: string[][]): { foco: number; total: number } | null {
  const colunas = titulos.flatMap((t, i) => (t.startsWith('META MES CAMPANHA') ? [i] : []))
  if (colunas.length < 2) return null
  const grupo = (coluna: number) => {
    for (const linha of [...acima].reverse()) {
      for (let i = coluna; i >= 0; i--) if ((linha[i] ?? '').trim()) return normalizar(linha[i])
    }
    return ''
  }
  const foco = colunas.find((c) => grupo(c).includes('FOCO'))
  if (foco === undefined) return { foco: colunas[0], total: colunas[1] }
  return { foco, total: colunas.find((c) => c !== foco)! }
}

/** Abas na ordem do arquivo, a chamada "CNPJ" primeiro. */
function caminhosDasAbas(texto: (c: string) => string | null, xml: (c: string) => Document): string[] {
  const livro = texto('xl/workbook.xml')
  const relacoes = texto('xl/_rels/workbook.xml.rels')
  if (!livro || !relacoes) return []
  const alvos = new Map(
    [...xml(relacoes).getElementsByTagName('Relationship')].map((r) => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']),
  )
  const abas = [...xml(livro).getElementsByTagName('sheet')].map((s) => {
    const alvo = alvos.get(s.getAttribute('r:id')) ?? ''
    return { nome: normalizar(s.getAttribute('name') ?? ''), caminho: alvo.startsWith('/') ? alvo.slice(1) : `xl/${alvo}` }
  })
  return [...abas.filter((a) => a.nome === 'CNPJ'), ...abas.filter((a) => a.nome !== 'CNPJ')].map((a) => a.caminho)
}

/** Linhas da aba como texto, cada célula na posição da sua coluna (A = 0). */
function lerCelulas(aba: Document, compartilhadas: string[]): string[][] {
  return [...aba.getElementsByTagName('row')].map((row) => {
    const linha: string[] = []
    for (const c of row.getElementsByTagName('c')) {
      const ref = c.getAttribute('r') ?? ''
      const coluna = [...ref.replace(/\d+$/, '')].reduce((n, letra) => n * 26 + letra.charCodeAt(0) - 64, 0) - 1
      const tipo = c.getAttribute('t')
      const v = c.getElementsByTagName('v')[0]?.textContent ?? ''
      linha[coluna] =
        tipo === 's'
          ? (compartilhadas[Number(v)] ?? '')
          : tipo === 'inlineStr'
            ? [...c.getElementsByTagName('t')].map((t) => t.textContent ?? '').join('')
            : v
    }
    return Array.from(linha, (x) => x ?? '')
  })
}

/** Maiúsculas, sem acento e sem espaço sobrando — "Classificação " -> "CLASSIFICACAO". */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toUpperCase()
}
