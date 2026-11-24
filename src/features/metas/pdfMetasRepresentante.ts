import { dataDeHojeParaArquivo, rotuloMes, rotuloMesCurto } from '../../shared/lib/mes'
import { formatarValorMeta } from '../../shared/lib/unidadeMeta'
import { rotuloPeriodoMeta } from './periodoMeta'
import type { MetaRepresentante, Meta } from '../../types'
import urlLogo from '../../assets/logo-sulbiologic.png'

export interface LinhaPdfMeta {
  meta: Meta
  atribuicao: MetaRepresentante | null
  valorMeta: number
  valorRealizado: number
  falta: number
  percentual: number | null
}

interface Dados {
  representante: string
  mes: string
  /** Um grupo por fornecedor, com o nome dele de título; sem título quando o representante só tem um. */
  grupos: { titulo?: string; linhas: LinhaPdfMeta[] }[]
  progressoMedio: number | null
  /** null esconde o total — ele é do representante inteiro, então só vale com todos os fornecedores. */
  totalVendido: number | null
}

const COR_TEXTO: [number, number, number] = [29, 29, 31]
const COR_SUAVE: [number, number, number] = [110, 110, 115]
const COR_TRILHA: [number, number, number] = [229, 229, 234]
const COR_BARRA: [number, number, number] = [0, 113, 227]
const COR_COMPLETA: [number, number, number] = [52, 168, 83]

/** Passa o logo por um canvas: o PNG original é entrelaçado, e o jsPDF lida melhor com a versão redesenhada. */
export function carregarLogo(): Promise<{ dados: string; proporcao: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      resolve({ dados: canvas.toDataURL('image/png'), proporcao: img.naturalHeight / img.naturalWidth })
    }
    img.onerror = reject
    img.src = urlLogo
  })
}

const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`

/**
 * Baixa um PDF com as metas do representante no mês — o mesmo que a tela "Meta Representante" mostra.
 * As bibliotecas de PDF só carregam no clique, pra não pesar a abertura do sistema.
 */
export async function exportarPdfMetasRepresentante({ representante, mes, grupos, progressoMedio, totalVendido }: Dados) {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    carregarLogo(),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margem = 14
  const largura = doc.internal.pageSize.getWidth()

  const larguraLogo = 36
  const alturaLogo = larguraLogo * logo.proporcao
  doc.addImage(logo.dados, 'PNG', margem, 10, larguraLogo, alturaLogo)

  doc.setTextColor(...COR_SUAVE)
  doc.setFontSize(9)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`, largura - margem, 14, {
    align: 'right',
  })

  const topo = 10 + alturaLogo + 12
  doc.setTextColor(...COR_TEXTO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(representante, margem, topo)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COR_SUAVE)
  const mesTexto = rotuloMes(mes)
  doc.text(`Metas de ${mesTexto}`, margem, topo + 7)

  let y = topo + 15
  if (progressoMedio !== null || totalVendido !== null) {
    doc.setFontSize(9)
    doc.text('Progresso médio', margem, y)
    if (totalVendido !== null) doc.text('Total vendido', margem + 60, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COR_TEXTO)
    doc.text(progressoMedio === null ? '-' : pct(progressoMedio), margem, y + 7)
    if (totalVendido !== null) {
      doc.text(totalVendido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), margem + 60, y + 7)
    }
    doc.setFont('helvetica', 'normal')
    y += 16
  }

  for (const grupo of grupos) {
    // Título do fornecedor não fica sozinho no pé da página, longe da tabela dele.
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 20
    }
    if (grupo.titulo) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...COR_TEXTO)
      doc.text(grupo.titulo, margem, y + 4)
      doc.setFont('helvetica', 'normal')
      y += 7
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [['Meta', 'Meta', 'Realizado', 'Falta', 'Progresso']],
      body: grupo.linhas.map(({ meta, atribuicao, valorMeta, valorRealizado, falta, percentual }) => [
        [
          meta.nome,
          meta.unidade === 'KG' && atribuicao?.realizadoEmReais != null
            ? formatarValorMeta(atribuicao.realizadoEmReais, 'REAL')
            : null,
          rotuloPeriodoMeta(meta),
          meta.descricao,
        ]
          .filter(Boolean)
          .join('\n'),
        percentual === null ? '-' : formatarValorMeta(valorMeta, meta.unidade),
        atribuicao ? formatarValorMeta(valorRealizado, meta.unidade) : '-',
        percentual === null ? '-' : formatarValorMeta(falta, meta.unidade),
        percentual === null ? '-' : pct(percentual),
      ]),
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2.5, textColor: COR_TEXTO, valign: 'middle' },
      headStyles: { fontStyle: 'bold', textColor: COR_SUAVE, fontSize: 8, lineWidth: { bottom: 0.3 }, lineColor: COR_TRILHA },
      bodyStyles: { lineWidth: { bottom: 0.1 }, lineColor: COR_TRILHA },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 32 },
        2: { halign: 'right', cellWidth: 32 },
        3: { halign: 'right', cellWidth: 32 },
        4: { halign: 'right', cellWidth: 38 },
      },
      didParseCell: (data) => {
        if (data.column.index > 0 && data.section === 'head') data.cell.styles.halign = 'right'
      },
      // Barra de progresso à esquerda do percentual, como na tela.
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 4) return
        const percentual = grupo.linhas[data.row.index]?.percentual
        if (percentual == null) return
        const larguraBarra = 18
        const x = data.cell.x + 2.5
        const yBarra = data.cell.y + data.cell.height / 2 - 1
        doc.setFillColor(...COR_TRILHA)
        doc.roundedRect(x, yBarra, larguraBarra, 2, 1, 1, 'F')
        const preenchido = (larguraBarra * Math.min(percentual, 100)) / 100
        if (preenchido > 0) {
          doc.setFillColor(...(percentual >= 100 ? COR_COMPLETA : COR_BARRA))
          doc.roundedRect(x, yBarra, preenchido, 2, 1, 1, 'F')
        }
      },
    })

    if (!grupo.linhas.length) {
      const fim = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
      doc.setFontSize(9)
      doc.setTextColor(...COR_SUAVE)
      doc.text('Nenhuma meta pra esse representante.', margem, fim + 6)
      y = fim + 14
    } else {
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    }
  }

  const nomeArquivo = `metas-${representante}-${rotuloMesCurto(mes).replace('/', '-')}-${dataDeHojeParaArquivo()}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .toLowerCase()
  doc.save(`${nomeArquivo}.pdf`)
}
