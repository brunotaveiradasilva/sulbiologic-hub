import { formatarData, hoje } from '../../shared/lib/datas'
import type { Resumo } from '../../types'

interface Cartao {
  rotulo: string
  valor: number
  nota: string
  cor?: string
}

export function PainelResumo({ resumo }: { resumo: Resumo }) {
  const cartoes: Cartao[] = [
    { rotulo: 'Retiradas de hoje', valor: resumo.retiradasHoje, nota: `agendadas para ${formatarData(hoje())}` },
    { rotulo: 'Devoluções de hoje', valor: resumo.devolucoesHoje, nota: 'vencem hoje' },
    { rotulo: 'Em posse', valor: resumo.emPosse, nota: 'materiais fora do estoque' },
    {
      rotulo: 'Atrasados',
      valor: resumo.atrasados,
      nota: resumo.atrasados ? 'cobrar devolução' : 'nada em atraso',
      cor: resumo.atrasados ? 'var(--st-atrasado)' : undefined,
    },
  ]

  return (
    <div className="stats">
      {cartoes.map((c) => (
        <div className="stat" key={c.rotulo}>
          <span className="label">{c.rotulo}</span>
          <span className="value" style={c.cor ? { color: c.cor } : undefined}>
            {c.valor}
          </span>
          <span className="note">{c.nota}</span>
        </div>
      ))}
    </div>
  )
}
