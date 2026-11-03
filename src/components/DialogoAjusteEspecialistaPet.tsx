import { useState } from 'react'
import { Modal } from './Modal'
import type { ClienteEspecialistaPet } from '../types'

interface Props {
  cliente: ClienteEspecialistaPet
  aoFechar: () => void
  /** null remove o ajuste. */
  aoSalvar: (realizadoTotal: number | null) => void
}

const kg = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Lança à mão o kg de todos os SKUs de um cliente, no lugar do da ADS. O campo já vem com a meta, que
 * é o caso comum: dar o cliente como 100%. O desconto da tela e do PDF passa a sair desse kg.
 */
export function DialogoAjusteEspecialistaPet({ cliente, aoFechar, aoSalvar }: Props) {
  const [valor, setValor] = useState(String(cliente.realizadoTotalAjustado ?? cliente.metaTotal))

  function salvar(realizadoTotal: number | null) {
    aoSalvar(realizadoTotal)
    aoFechar()
  }

  return (
    <Modal titulo="Ajustar kg" textoConfirmar="Salvar ajuste" aoFechar={aoFechar} aoConfirmar={() => salvar(Number(valor))}>
      <p className="hint">
        {cliente.nome}: {kg(cliente.realizadoTotal)} kg na ADS, meta de {kg(cliente.metaTotal)} kg.
      </p>

      <div className="field">
        <label htmlFor="ep-ajuste-kg">Todos os SKUs (kg)</label>
        <input
          id="ep-ajuste-kg"
          type="number"
          min="0"
          step="any"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <p className="hint">
          O desconto passa a sair desse kg, e todos que veem esse cliente enxergam o valor ajustado. A sincronização com
          a ADS não muda o ajuste; importar de novo a planilha do mês apaga.
        </p>
      </div>

      {cliente.realizadoTotalAjustado !== undefined ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => salvar(null)}>
          Remover ajuste
        </button>
      ) : null}
    </Modal>
  )
}
