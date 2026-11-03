import { dataDeHojeParaArquivo, rotuloMes, rotuloMesCurto } from './mes'
import { formatarValorMeta } from './unidadeMeta'
import { descontoEspecialistaPet, realizadoTotalEfetivo } from './especialistaPet'
import { carregarLogo } from './pdfMetasRepresentante'
import type { ClienteEspecialistaPet } from '../types'

const COR_TEXTO: [number, number, number] = [29, 29, 31]
const COR_SUAVE: [number, number, number] = [110, 110, 115]
const COR_TRILHA: [number, number, number] = [229, 229, 234]
const COR_BATEU: [number, number, number] = [36, 138, 61]

const kg = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const pct = (meta: number, realizado: number) =>
  meta > 0 ? `${((realizado / meta) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%` : '-'

interface Dados {
  mes: string
  /** Um representante por página, cada um com os clientes dele. */
  representantes: { nome: string; clientes: ClienteEspecialistaPet[] }[]
}

/**
 * Baixa o PDF da campanha Especialista Pet: por representante, as metas e o realizado de cada cliente
 * (produto foco com e sem WILD, todos os SKUs) e o desconto conquistado — o mesmo da tela. Em paisagem,
 * pelas colunas. As bibliotecas de PDF só carregam no clique.
 */
export async function exportarPdfEspecialistaPet({ mes, representantes }: Dados) {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    carregarLogo(),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const margem = 12
  const largura = doc.internal.pageSize.getWidth()
  const geradoEm = `Gerado em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`

  representantes.forEach(({ nome, clientes }, indice) => {
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
    doc.text(`Especialista Pet · metas de ${rotuloMes(mes)}`, margem, topo + 6.5)

    // Os mesmos três números dos cards da tela.
    const bateramTotal = clientes.filter((c) => c.metaTotal > 0 && realizadoTotalEfetivo(c) >= c.metaTotal).length
    const bateramFoco = clientes.filter((c) => c.metaFoco > 0 && c.realizadoFoco >= c.metaFoco).length
    const desconto = clientes.reduce((soma, c) => soma + descontoEspecialistaPet(c).valor, 0)
    const kpis: [string, string][] = [
      ['Bateram todos os SKUs', `${bateramTotal}/${clientes.length}`],
      ['Bateram o produto foco', `${bateramFoco}/${clientes.length}`],
      ['Desconto conquistado', formatarValorMeta(desconto, 'REAL')],
    ]
    const yKpi = topo + 15
    kpis.forEach(([rotulo, valor], i) => {
      const x = margem + i * 62
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

    const ordenados = [...clientes].sort((a, b) => b.metaTotal - a.metaTotal || a.nome.localeCompare(b.nome, 'pt-BR'))
    autoTable(doc, {
      startY: yKpi + 14,
      margin: { left: margem, right: margem },
      head: [
        [
          { content: 'Cliente', rowSpan: 2 },
          { content: 'Produto foco NATTU (kg)', colSpan: 5, styles: { halign: 'center' } },
          { content: 'Todos os SKUs (kg)', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Desconto', rowSpan: 2 },
        ],
        ['Meta', 'WILD', 'Sem WILD', 'Total', 'Efet.', 'Meta', 'Realizado', 'Efet.'],
      ],
      body: ordenados.map((c) => {
        const wild = c.realizadoFocoWild ?? 0
        const d = descontoEspecialistaPet(c)
        return [
          `${c.nome}\n${c.codigoCliente} · ${c.classificacao.toLowerCase() || 'sem classificação'}`,
          kg(c.metaFoco),
          kg(wild),
          kg(c.realizadoFoco - wild),
          kg(c.realizadoFoco),
          pct(c.metaFoco, c.realizadoFoco),
          kg(c.metaTotal),
          kg(realizadoTotalEfetivo(c)),
          pct(c.metaTotal, realizadoTotalEfetivo(c)),
          d.valor > 0 ? formatarValorMeta(d.valor, 'REAL') : '-',
        ]
      }),
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2, textColor: COR_TEXTO, valign: 'middle' },
      headStyles: { fontStyle: 'bold', textColor: COR_SUAVE, fontSize: 7.5, lineWidth: { bottom: 0.3 }, lineColor: COR_TRILHA },
      bodyStyles: { lineWidth: { bottom: 0.1 }, lineColor: COR_TRILHA },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 17 },
        2: { cellWidth: 17 },
        3: { cellWidth: 19 },
        4: { cellWidth: 17, fontStyle: 'bold' },
        5: { cellWidth: 15 },
        6: { cellWidth: 22 },
        7: { cellWidth: 24 },
        8: { cellWidth: 15 },
        9: { cellWidth: 28, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        // Números à direita; só "Cliente" e os títulos dos grupos ficam como estão.
        const titulo = data.section === 'head' && data.row.index === 0 && data.column.index > 0 && data.column.index < 9
        if (data.column.index > 0 && !titulo) data.cell.styles.halign = 'right'
        if (data.section !== 'body') return
        const c = ordenados[data.row.index]
        // Efetividade de quem bateu a meta em verde, como a barra completa na tela.
        if (data.column.index === 5 && c.metaFoco > 0 && c.realizadoFoco >= c.metaFoco) data.cell.styles.textColor = COR_BATEU
        if (data.column.index === 8 && c.metaTotal > 0 && realizadoTotalEfetivo(c) >= c.metaTotal) data.cell.styles.textColor = COR_BATEU
      },
      didDrawPage: () => {
        doc.setFontSize(8)
        doc.setTextColor(...COR_SUAVE)
        doc.text(`${nome} · Especialista Pet · ${rotuloMesCurto(mes)}`, margem, doc.internal.pageSize.getHeight() - 6)
      },
    })
  })

  const quem = representantes.length === 1 ? representantes[0].nome : 'todos'
  const nomeArquivo = `especialista-pet-${quem}-${rotuloMesCurto(mes).replace('/', '-')}-${dataDeHojeParaArquivo()}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .toLowerCase()
  doc.save(`${nomeArquivo}.pdf`)
}
