import { useMemo } from 'react'
import { mesAtual, opcoesDeMes, rotuloMesCurto } from '../lib/mes'

interface Props {
  id: string
  mes: string
  /** Meses que já têm meta cadastrada — entram na lista mesmo se estiverem fora da janela padrão. */
  mesesComDados: string[]
  aoMudar: (mes: string) => void
}

/** Filtro de mês das telas de metas, pra ficar do lado do filtro de representante/fornecedor. */
export function SeletorMes({ id, mes, mesesComDados, aoMudar }: Props) {
  const opcoes = useMemo(() => opcoesDeMes([...mesesComDados, mes]), [mesesComDados, mes])
  const atual = mesAtual()

  return (
    <div className="field consulta-filtro consulta-filtro-mes">
      <label htmlFor={id}>Mês</label>
      <select id={id} value={mes} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map((m) => (
          <option key={m} value={m}>
            {rotuloMesCurto(m)}
            {m === atual ? ' (atual)' : m < atual ? ' (fechado)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
