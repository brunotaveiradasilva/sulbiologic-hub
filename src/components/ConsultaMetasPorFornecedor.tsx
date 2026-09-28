import { useMemo, useState } from 'react'
import { EstadoVazio } from './EstadoVazio'
import { DialogoCopiarMetasMes } from './DialogoCopiarMetasMes'
import { DialogoEditarMetaRepresentante } from './DialogoEditarMetaRepresentante'
import { LinhaMetaRepresentante } from './LinhaMetaRepresentante'
import { SeletorMes } from './SeletorMes'
import { mesFechado, rotuloMes, rotuloMesCurto, somarMeses } from '../lib/mes'
import type { MetaRepresentanteEntrada } from '../lib/api'
import type { Fornecedor, Meta, MetaRepresentante, Representante } from '../types'

interface Props {
  fornecedores: Fornecedor[]
  representantes: Representante[]
  metas: Meta[]
  metasRepresentante: MetaRepresentante[]
  mes: string
  aoMudarMes: (mes: string) => void
  /** Sem aoSalvar e aoCopiarMes, a tela é só de consulta (supervisor e representante). */
  aoSalvar?: (mv: MetaRepresentanteEntrada, id?: string | null) => Promise<MetaRepresentante>
  aoCopiarMes?: (de: string, para: string, fornecedorId?: string) => Promise<number>
}

/**
 * Uma tabela só com os representantes de um fornecedor escolhido no mês escolhido, uma linha por
 * representante e meta — o valor de meta muda por um diálogo com confirmação, e dá pra trazer os
 * valores do mês anterior de uma vez.
 */
export function ConsultaMetasPorFornecedor({
  fornecedores,
  representantes,
  metas,
  metasRepresentante,
  mes,
  aoMudarMes,
  aoSalvar,
  aoCopiarMes,
}: Props) {
  const [fornecedorId, setFornecedorId] = useState(fornecedores[0]?.id ?? '')
  // Vazio = todas as metas do fornecedor.
  const [metaId, setMetaId] = useState('')
  const [editando, setEditando] = useState<{ representante: Representante; meta: Meta } | null>(null)
  const [copiando, setCopiando] = useState(false)

  const mesAnterior = somarMeses(mes, -1)
  const fechado = mesFechado(mes)
  const mesesComDados = useMemo(() => [...new Set(metasRepresentante.map((mv) => mv.mes))], [metasRepresentante])

  const atribuicaoDe = (representanteId: string, metaId: string, noMes = mes) =>
    metasRepresentante.find(
      (mv) => mv.representante.id === representanteId && mv.meta.id === metaId && mv.mes === noMes,
    ) ?? null

  // Na ordem que o admin escolheu na aba Metas (a API já devolve assim).
  const metasDoFornecedor = useMemo(() => metas.filter((m) => m.fornecedor.id === fornecedorId), [metas, fornecedorId])
  // Meta escolhida que não é desse fornecedor (ex: acabou de trocar de fornecedor) vale como "todas".
  const metasNaTabela = metasDoFornecedor.some((m) => m.id === metaId)
    ? metasDoFornecedor.filter((m) => m.id === metaId)
    : metasDoFornecedor

  const representantesDoFornecedor = useMemo(
    () =>
      representantes
        .filter((v) => v.fornecedores.some((f) => f.id === fornecedorId))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [representantes, fornecedorId],
  )

  // O que dá pra trazer do mês anterior: tem valor lá e ainda não tem neste mês (a API só copia isso).
  // Valor 0 é "sem meta" — a linha que a sincronização cria só pra guardar o realizado.
  const paraCopiar = metasRepresentante.filter(
    (mv) =>
      mv.mes === mesAnterior &&
      mv.valorMeta > 0 &&
      mv.meta.fornecedor.id === fornecedorId &&
      !atribuicaoDe(mv.representante.id, mv.meta.id)?.valorMeta,
  ).length

  const fornecedor = fornecedores.find((f) => f.id === fornecedorId) ?? null

  if (!fornecedores.length) {
    return (
      <EstadoVazio titulo="Nenhum fornecedor cadastrado" texto="Cadastre um fornecedor pra consultar as metas dele." />
    )
  }

  return (
    <div>
      <div className="consulta-filtros">
        <div className="field consulta-filtro">
          <label htmlFor="cf-fornecedor">Fornecedor</label>
          <select
            id="cf-fornecedor"
            value={fornecedorId}
            onChange={(e) => {
              setFornecedorId(e.target.value)
              setMetaId('')
            }}
          >
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field consulta-filtro">
          <label htmlFor="cf-meta">Meta</label>
          <select id="cf-meta" value={metaId} onChange={(e) => setMetaId(e.target.value)}>
            <option value="">Todas as metas</option>
            {metasDoFornecedor.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <SeletorMes id="cf-mes" mes={mes} mesesComDados={mesesComDados} aoMudar={aoMudarMes} />
      </div>

      {fechado ? (
        <p className="hint consulta-info">
          {rotuloMesCurto(mes)} já fechou — as metas desse mês ficam só pra consulta.
        </p>
      ) : aoCopiarMes && paraCopiar > 0 && representantesDoFornecedor.length ? (
        <div className="consulta-acoes">
          <button className="btn" onClick={() => setCopiando(true)}>
            Copiar metas de {rotuloMes(mesAnterior)}
          </button>
          <span className="hint">{paraCopiar} meta(s) de lá ainda sem valor neste mês</span>
        </div>
      ) : null}

      {!metasDoFornecedor.length ? (
        <div className="table-wrap">
          <EstadoVazio
            titulo={`Nenhuma meta pra ${fornecedor?.nome ?? 'esse fornecedor'}`}
            texto="Cadastre uma meta pra esse fornecedor pra poder atribuir valores aos representantes."
          />
        </div>
      ) : !representantesDoFornecedor.length ? (
        <div className="table-wrap">
          <EstadoVazio
            titulo="Nenhum representante pra esse fornecedor"
            texto="Nenhum representante trabalha pra esse fornecedor ainda."
          />
        </div>
      ) : (
        <div className="table-wrap table-wrap-compacta">
          <table>
            <thead>
              <tr>
                <th>Representante</th>
                <th>Meta</th>
                <th className="num">Valor da meta</th>
                <th className="num">Realizado</th>
                <th className="num">Falta</th>
                <th className="num">Progresso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {representantesDoFornecedor.flatMap((v) =>
                metasNaTabela.map((meta) => (
                  <LinhaMetaRepresentante
                    key={`${v.id}:${meta.id}`}
                    representanteNome={v.nome}
                    meta={meta}
                    atribuicao={atribuicaoDe(v.id, meta.id)}
                    aoEditar={fechado || !aoSalvar ? null : () => setEditando({ representante: v, meta })}
                  />
                )),
              )}
            </tbody>
          </table>
        </div>
      )}

      {editando && aoSalvar ? (
        <DialogoEditarMetaRepresentante
          representante={editando.representante}
          meta={editando.meta}
          mes={mes}
          atribuicao={atribuicaoDe(editando.representante.id, editando.meta.id)}
          aoFechar={() => setEditando(null)}
          aoSalvar={aoSalvar}
        />
      ) : null}

      {copiando && fornecedor && aoCopiarMes ? (
        <DialogoCopiarMetasMes
          de={mesAnterior}
          para={mes}
          fornecedorNome={fornecedor.nome}
          quantidade={paraCopiar}
          aoCopiar={() => aoCopiarMes(mesAnterior, mes, fornecedor.id)}
          aoFechar={() => setCopiando(false)}
        />
      ) : null}
    </div>
  )
}
