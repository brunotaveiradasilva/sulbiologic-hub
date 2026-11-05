import { SEMANAS, detalheCliente, reaisDaSemana, rotuloDias } from './campanhaOrgannact'
import { dataDeHojeParaArquivo, rotuloMes, rotuloMesCurto } from './mes'
import { carregarLogo } from './pdfMetasRepresentante'
import { formatarValorMeta } from './unidadeMeta'
import type { ClienteCampanhaOrgannact } from '../types'

const COR_TEXTO: [number, number, number] = [29, 29, 31]
const COR_SUAVE: [number, number, number] = [110, 110, 115]
const COR_TRILHA: [number, number, number] = [229, 229, 234]
const COR_COMPROU: [number, number, number] = [0, 113, 227]

const reais = (n: number) => formatarValorMeta(n, 'REAL')

interface Dados {
  mes: string
  /** Filtro da tela (situação, busca), mostrado no título; null com a lista inteira. */
  filtro: string | null
  /** Um representante por página: a carteira dá os números do topo, as linhas são as da tabela. */
  representantes: { nome: string; carteira: ClienteCampanhaOrgannact[]; linhas: ClienteCampanhaOrgannact[] }[]
}

/**
 * Baixa o PDF da positivação Organnact: por representante, os números da carteira e a grade cliente × semana,
 * na ordem e com os filtros da tela. As bibliotecas de PDF só carregam no clique.
 */
export async function exportarPdfCampanhaOrgannact({ mes, filtro, representantes }: Dados) {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    carregarLogo(),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const margem = 12
  const largura = doc.internal.pageSize.getWidth()
  const geradoEm = `Gerado em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`

  representantes.forEach(({ nome, carteira, linhas }, indice) => {
    if (indice > 0) doc.addPage()

    const larguraLogo = 30
    const alturaLogo = larguraLogo * logo.proporcao
    doc.addImage(logo.dados, 'PNG', margem, 9, larguraLogo, alturaLogo)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COR_SUAVE)
    doc.setFontSize(9)
    doc.text(geradoEm, largura - margem, 13, { align: 'right' })

    const topo = 9 + alturaLogo + 10
    doc.setTextColor(...COR_TEXTO)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.text(nome, margem, topo)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...COR_SUAVE)
    doc.text(`Positivação Organnact · ${rotuloMes(mes)}${filtro ? ` · ${filtro}` : ''}`, margem, topo + 6.5)

    // Os mesmos quatro números dos cards da tela: sempre da carteira inteira, mesmo com filtro.
    const positivados = carteira.filter((c) => c.positivado)
    const percentual = carteira.length ? (positivados.length / carteira.length) * 100 : 0
    const kpis: [string, string][] = [
      ['Clientes na carteira', String(carteira.length)],
      ['Já positivaram', `${positivados.length} (${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%)`],
      ['Ainda faltam', String(carteira.length - positivados.length)],
      ['Organnact vendido', reais(positivados.reduce((soma, c) => soma + c.organnactReais, 0))],
    ]
    const yKpi = topo + 15
    kpis.forEach(([rotulo, valor], i) => {
      const x = margem + i * 50
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...COR_SUAVE)
      doc.text(rotulo, x, yKpi)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...COR_TEXTO)
      doc.text(valor, x, yKpi + 7)
    })
    doc.setFont('helvetica', 'normal')

    const totalSemana = (s: number) => linhas.reduce((soma, c) => soma + reaisDaSemana(c, s), 0)
    autoTable(doc, {
      startY: yKpi + 14,
      margin: { left: margem, right: margem },
      head: [['Cliente', ...SEMANAS.map((s) => `Semana ${s}\n${rotuloDias(mes, s)}`), 'Total']],
      body: linhas.map((c) => [
        `${c.nome}\n${detalheCliente(c)}`,
        ...SEMANAS.map((s) => {
          const v = reaisDaSemana(c, s)
          return v === 0 ? '' : reais(v)
        }),
        c.positivado ? reais(c.organnactReais) : '',
      ]),
      foot: [
        [
          'Total',
          ...SEMANAS.map((s) => (totalSemana(s) ? reais(totalSemana(s)) : '')),
          reais(SEMANAS.reduce((soma, s) => soma + totalSemana(s), 0)),
        ],
      ],
      showFoot: 'lastPage',
      rowPageBreak: 'avoid',
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2, textColor: COR_TEXTO, valign: 'middle' },
      headStyles: { fontStyle: 'bold', textColor: COR_SUAVE, fontSize: 7.5, lineWidth: { bottom: 0.3 }, lineColor: COR_TRILHA },
      bodyStyles: { lineWidth: { bottom: 0.1 }, lineColor: COR_TRILHA },
      footStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 26 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 28, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index > 0) data.cell.styles.halign = 'right'
        // As semanas em que o cliente comprou em azul, como na tela.
        if (data.section === 'body' && data.column.index >= 1 && data.column.index <= SEMANAS.length && data.cell.raw) {
          data.cell.styles.textColor = COR_COMPROU
        }
      },
      didDrawPage: () => {
        doc.setFontSize(8)
        doc.setTextColor(...COR_SUAVE)
        doc.text(`${nome} · Positivação Organnact · ${rotuloMesCurto(mes)}`, margem, doc.internal.pageSize.getHeight() - 6)
      },
    })
  })

  const quem = representantes.length === 1 ? representantes[0].nome : 'todos'
  const nomeArquivo = `positivacao-organnact-${quem}-${rotuloMesCurto(mes).replace('/', '-')}-${dataDeHojeParaArquivo()}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .toLowerCase()
  doc.save(`${nomeArquivo}.pdf`)
}
