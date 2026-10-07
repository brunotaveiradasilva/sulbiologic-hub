import { useMemo, useState } from 'react'
import { Modal } from './Modal'
import { mesAtual, opcoesDeMes, rotuloMes, rotuloMesCurto } from '../lib/mes'

interface Props {
  nomeArquivo: string
  quantidadeClientes: number
  /** Mês que já vem escolhido: o do nome do arquivo, ou o que está na tela. */
  mesSugerido: string
  /** Mês que aparece no nome do arquivo ("... 09.2026 ..."), null se não tiver. */
  mesDoArquivo: string | null
  mesesComDados: string[]
  aoFechar: () => void
  aoImportar: (mes: string) => void
}

/**
 * Pergunta pra qual mês vão os clientes da planilha antes de importar — o nome do arquivo só sugere,
 * pra dar pra usar a planilha de um mês em outro (ex.: as metas de setembro em outubro).
 */
export function DialogoImportarEspecialistaPet({
  nomeArquivo,
  quantidadeClientes,
  mesSugerido,
  mesDoArquivo,
  mesesComDados,
  aoFechar,
  aoImportar,
}: Props) {
  const [mes, setMes] = useState(mesSugerido)
  const opcoes = useMemo(() => opcoesDeMes([...mesesComDados, mesSugerido]), [mesesComDados, mesSugerido])
  const atual = mesAtual()
  const jaTem = mesesComDados.includes(mes)

  function confirmar() {
    aoImportar(mes)
    aoFechar()
  }

  return (
    <Modal titulo="Importar planilha" textoConfirmar="Importar" aoFechar={aoFechar} aoConfirmar={confirmar}>
      <p className="hint">
        {nomeArquivo}: {quantidadeClientes} clientes.
      </p>

      <div className="field">
        <label htmlFor="ep-importar-mes">Mês da campanha</label>
        <select id="ep-importar-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
          {opcoes.map((m) => (
            <option key={m} value={m}>
              {rotuloMesCurto(m)}
              {m === atual ? ' (atual)' : ''}
            </option>
          ))}
        </select>
        {mesDoArquivo && mesDoArquivo !== mes ? (
          <p className="hint">
            O nome do arquivo é de {rotuloMes(mesDoArquivo)}: as metas dele vão valer em {rotuloMes(mes)}.
          </p>
        ) : null}
        {jaTem ? (
          <p className="hint">Os clientes já importados em {rotuloMes(mes)} serão substituídos pelos da planilha.</p>
        ) : null}
      </div>
    </Modal>
  )
}
