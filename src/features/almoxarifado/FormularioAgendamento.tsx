import { useMemo, useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import { hoje } from '../../shared/lib/datas'
import { buscarMaterial, clientesConhecidos, quantidadeComprometida } from './regras'
import type { Agendamento, Material, Status } from '../../types'

interface Props {
  /** Agendamento em edição, ou null para um novo. */
  agendamento: Agendamento | null
  materialInicial?: string
  /** Dia (AAAA-MM-DD) em que o novo agendamento começa — vem do clique no calendário. */
  dataInicial?: string
  materiais: Material[]
  agendamentos: Agendamento[]
  aoFechar: () => void
  aoSalvar: (agendamento: Omit<Agendamento, 'id'>, id?: string | null) => void
}

function formVazio(materialId: string, dia = hoje()) {
  return {
    materialId,
    qtd: '1',
    responsavel: '',
    cliente: '',
    retirada: dia,
    devolucao: dia,
    status: 'agendado' as Status,
    obs: '',
  }
}

/** Montado só enquanto o diálogo está aberto, então o formulário já nasce preenchido. */
export function FormularioAgendamento({
  agendamento,
  materialInicial,
  dataInicial,
  materiais,
  agendamentos,
  aoFechar,
  aoSalvar,
}: Props) {
  const [form, setForm] = useState(() =>
    agendamento
      ? { ...agendamento, qtd: String(agendamento.qtd) }
      : formVazio(materialInicial || materiais[0]?.id || '', dataInicial),
  )
  const [erro, setErro] = useState('')

  const clientes = useMemo(() => clientesConhecidos(agendamentos), [agendamentos])

  // Quanto ainda sobra desse material no período escolhido.
  const disponibilidade = useMemo(() => {
    const material = buscarMaterial(materiais, form.materialId)
    if (!material || !form.retirada || !form.devolucao || form.devolucao < form.retirada) return null

    const usado = quantidadeComprometida(
      agendamentos,
      material.id,
      form.retirada,
      form.devolucao,
      agendamento?.id,
    )
    const livre = material.estoque - usado
    const pedido = Number.parseInt(form.qtd, 10) || 0

    return { livre, estoque: material.estoque, excedeu: pedido > livre }
  }, [materiais, agendamentos, agendamento, form])

  function confirmar() {
    const qtd = Number.parseInt(form.qtd, 10)
    const responsavel = form.responsavel.trim()

    if (!form.materialId) return setErro('Escolha um material.')
    if (!(qtd >= 1)) return setErro('A quantidade precisa ser pelo menos 1.')
    if (!responsavel) return setErro('Informe o responsável.')
    if (!form.retirada || !form.devolucao) return setErro('Preencha as duas datas.')
    if (form.devolucao < form.retirada) return setErro('A devolução não pode ser antes da retirada.')

    aoSalvar(
      {
        materialId: form.materialId,
        qtd,
        responsavel,
        cliente: form.cliente.trim(),
        retirada: form.retirada,
        devolucao: form.devolucao,
        status: form.status,
        obs: form.obs.trim(),
      },
      agendamento?.id,
    )
    aoFechar()
  }

  return (
    <Modal
      titulo={agendamento ? 'Editar agendamento' : 'Novo agendamento'}
      textoConfirmar="Salvar agendamento"
      mensagem={erro}
      aoFechar={aoFechar}
      aoConfirmar={confirmar}
    >
      <div className="grid-2">
        <div className="field">
          <label htmlFor="a-material">Material</label>
          <select
            id="a-material"
            value={form.materialId}
            onChange={(e) => setForm({ ...form, materialId: e.target.value })}
          >
            {materiais.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
                {m.codigo ? ` · ${m.codigo}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="a-qtd">Quantidade</label>
          <input
            id="a-qtd"
            type="number"
            min={1}
            step={1}
            value={form.qtd}
            onChange={(e) => setForm({ ...form, qtd: e.target.value })}
          />
          {disponibilidade ? (
            <span className={`hint${disponibilidade.excedeu ? ' warn' : ''}`}>
              {disponibilidade.excedeu
                ? `Só há ${disponibilidade.livre} de ${disponibilidade.estoque} livre(s) nesse período.`
                : `Disponível no período: ${disponibilidade.livre} de ${disponibilidade.estoque}`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="a-responsavel">Responsável</label>
          <input
            id="a-responsavel"
            maxLength={80}
            placeholder="Quem retira o material"
            value={form.responsavel}
            onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="a-cliente">Cliente</label>
          <input
            id="a-cliente"
            maxLength={80}
            placeholder="Para quem o material vai"
            list="lista-clientes"
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
          />
          <datalist id="lista-clientes">
            {clientes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="a-retirada">Data de retirada</label>
          <input
            id="a-retirada"
            type="date"
            value={form.retirada}
            onChange={(e) => setForm({ ...form, retirada: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="a-devolucao">Data de devolução</label>
          <input
            id="a-devolucao"
            type="date"
            value={form.devolucao}
            onChange={(e) => setForm({ ...form, devolucao: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="a-status">Status</label>
        <select
          id="a-status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
        >
          <option value="agendado">Agendado — ainda não retirou</option>
          <option value="retirado">Retirado — está com o responsável</option>
          <option value="devolvido">Devolvido — de volta no estoque</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="a-obs">Observação</label>
        <textarea
          id="a-obs"
          maxLength={400}
          placeholder="Finalidade, local de uso, condição do item na retirada…"
          value={form.obs}
          onChange={(e) => setForm({ ...form, obs: e.target.value })}
        />
      </div>
    </Modal>
  )
}
