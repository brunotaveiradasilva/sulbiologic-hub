/**
 * Barra de progresso da meta no formato da faixa do logo: o percentual vai escrito dentro da própria faixa.
 * O texto aparece duas vezes, uma por baixo (cor de tinta) e uma dentro do preenchimento (branca, recortada
 * pela largura dele), então fica legível tanto na parte cheia quanto na vazia.
 */
export function FaixaProgresso({ percentual }: { percentual: number | null }) {
  const texto = percentual === null ? '—' : `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
  const completa = (percentual ?? 0) >= 100
  return (
    <span
      className="meta-progress-track"
      role="img"
      aria-label={percentual === null ? 'Sem meta' : `${texto} da meta`}
    >
      <span className="faixa-texto" aria-hidden="true">{texto}</span>
      <span
        className={`meta-progress-fill${completa ? ' is-complete' : ''}`}
        style={{ width: `${Math.min(Math.max(percentual ?? 0, 0), 100)}%` }}
      >
        <span className="faixa-texto" aria-hidden="true">{texto}</span>
      </span>
    </span>
  )
}
