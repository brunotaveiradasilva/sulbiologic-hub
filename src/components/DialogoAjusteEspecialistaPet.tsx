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
const umaCasa = (n: number) => Math.round(n * 10) / 10

/**
 * Lança à mão o resultado em kg de todos os SKUs de um cliente, no lugar do da ADS; a meta não muda. O
 * desconto da tela e do PDF passa a sair desse kg. A meta da planilha tem mais casas do que a tela
 * mostra, então digitar o número da tela (697,3 de uma meta de 697,344) conta como bater a meta.
 */
export function DialogoAjusteEspecialistaPet({ cliente, aoFechar, aoSalvar }: Props) {
  const metaNaTela = umaCasa(cliente.metaTotal)
  const [valor, setValor] = useState(String(umaCasa(cliente.realizadoTotalAjustado ?? cliente.realizadoTotal)))

  function salvar(realizadoTotal: number | null) {
    aoSalvar(realizadoTotal)
    aoFechar()
  }

  function confirmar() {
    const digitado = Number(valor)
    salvar(digitado === metaNaTela ? cliente.metaTotal : digitado)
  }

  return (
    <Modal titulo="Ajustar resultado" textoConfirmar="Salvar ajuste" aoFechar={aoFechar} aoConfirmar={confirmar}>
      <p className="hint">{cliente.nome}</p>
      <p className="hint">
        Resultado na ADS: {kg(cliente.realizadoTotal)} kg. Meta: {kg(cliente.metaTotal)} kg (não muda).
      </p>

      <div className="field">
        <label htmlFor="ep-ajuste-kg">Resultado de todos os SKUs (kg)</label>
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
          O desconto passa a sair desse resultado, e todos que veem esse cliente enxergam o valor ajustado. A
          sincronização com a ADS não muda o ajuste; importar de novo a planilha do mês apaga.
        </p>
      </div>

      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setValor(String(metaNaTela))}>
        Igualar à meta
      </button>
      {cliente.realizadoTotalAjustado !== undefined ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => salvar(null)}>
          Remover ajuste
        </button>
      ) : null}
    </Modal>
  )
}
