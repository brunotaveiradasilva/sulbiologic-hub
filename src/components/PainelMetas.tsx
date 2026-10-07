import { useMemo, useState } from 'react'
import { useMetas } from '../hooks/useMetas'
import { CarregandoTelaInteira } from './CarregandoTelaInteira'
import { EstadoVazio } from './EstadoVazio'
import { TabelaFornecedores } from './TabelaFornecedores'
import { FormularioFornecedor } from './FormularioFornecedor'
import { TabelaRepresentantes } from './TabelaRepresentantes'
import { FormularioRepresentante } from './FormularioRepresentante'
import { TabelaMetas } from './TabelaMetas'
import { FormularioMeta } from './FormularioMeta'
import { ConsultaMetasPorRepresentante } from './ConsultaMetasPorRepresentante'
import { ConsultaMetasPorFornecedor } from './ConsultaMetasPorFornecedor'
import { mesAtual } from '../lib/mes'
import { metasDoMes } from '../lib/metaOculta'
import { subabasMetas, type SubabaMetas } from '../lib/navegacao'
import type { Fornecedor, Meta, Representante } from '../types'

/**
 * Cadastros de apoio às metas — fornecedores, representantes e metas — e telas de consulta. Sem
 * isAdmin, só as consultas e sem editar nada (supervisor e representante; a API já manda pro
 * representante só o que é dele).
 */
interface Props {
  subaba: SubabaMetas
  aoMudarSubaba: (subaba: SubabaMetas) => void
  isAdmin: boolean
}

/** A navegação entre as subabas fica no menu lateral; as abas daqui só aparecem no celular, onde o menu vira só ícones. */
export function PainelMetas({ subaba, aoMudarSubaba, isAdmin }: Props) {
  const metas = useMetas()
  // Mês escolhido nas telas de consulta — o mesmo nas duas, e é o que o "Sincronizar com a ADS" recalcula.
  const [mes, setMes] = useState(mesAtual)
  // Na aba Metas as ocultas ficam escondidas até marcar "Mostrar metas ocultas".
  const [verOcultas, setVerOcultas] = useState(false)
  const quantasOcultas = metas.metas.filter((m) => m.oculta).length
  const metasNaLista = verOcultas ? metas.metas : metas.metas.filter((m) => !m.oculta)
  const metasNaConsulta = useMemo(
    () => metasDoMes(metas.metas, metas.metasRepresentante, mes),
    [metas.metas, metas.metasRepresentante, mes],
  )

  const [dialogoFornecedor, setDialogoFornecedor] = useState<{ aberto: boolean; fornecedor: Fornecedor | null }>({
    aberto: false,
    fornecedor: null,
  })
  const [dialogoRepresentante, setDialogoRepresentante] = useState<{ aberto: boolean; representante: Representante | null }>({
    aberto: false,
    representante: null,
  })
  const [dialogoMeta, setDialogoMeta] = useState<{ aberto: boolean; meta: Meta | null }>({
    aberto: false,
    meta: null,
  })

  const primeiraCarga =
    metas.carregando && !metas.fornecedores.length && !metas.representantes.length && !metas.metas.length

  function excluirFornecedor(fornecedor: Fornecedor) {
    if (!window.confirm(`Excluir o fornecedor "${fornecedor.nome}"?`)) return
    metas.removerFornecedor(fornecedor.id)
  }

  function excluirRepresentante(representante: Representante) {
    if (!window.confirm(`Excluir o representante "${representante.nome}"?`)) return
    metas.removerRepresentante(representante.id)
  }

  function excluirMeta(meta: Meta) {
    if (!window.confirm(`Excluir a meta "${meta.nome}"?`)) return
    metas.removerMeta(meta.id)
  }

  return (
    <section className="view" role="tabpanel">
      <div className="view-head">
        <div>
          <h2>Metas</h2>
        </div>
        {subaba === 'fornecedores' ? (
          <button className="btn btn-primary" onClick={() => setDialogoFornecedor({ aberto: true, fornecedor: null })}>
            + Cadastrar fornecedor
          </button>
        ) : null}
        {subaba === 'representantes' ? (
          <button className="btn btn-primary" onClick={() => setDialogoRepresentante({ aberto: true, representante: null })}>
            + Cadastrar representante
          </button>
        ) : null}
        {subaba === 'metas' ? (
          <button className="btn btn-primary" onClick={() => setDialogoMeta({ aberto: true, meta: null })}>
            + Cadastrar meta
          </button>
        ) : null}
        {isAdmin && (subaba === 'porRepresentante' || subaba === 'porFornecedor') ? (
          <button className="btn" disabled={metas.sincronizando} onClick={() => metas.sincronizarComAds(mes)}>
            {metas.sincronizando ? 'Sincronizando…' : 'Sincronizar com a ADS'}
          </button>
        ) : null}
      </div>

      {metas.erro ? (
        <div className="banner-erro" role="alert">
          <span>{metas.erro}</span>
          <button className="btn" onClick={metas.tentarNovamente}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      <nav className="tabs tabs-so-celular" role="tablist">
        {subabasMetas(isAdmin).map((s) => (
          <button key={s.valor} role="tab" aria-selected={subaba === s.valor} onClick={() => aoMudarSubaba(s.valor)}>
            {s.rotulo}
          </button>
        ))}
      </nav>

      {primeiraCarga ? (
        <EstadoVazio titulo="Carregando…" texto="Buscando os dados salvos no servidor." />
      ) : subaba === 'fornecedores' ? (
        <div className="table-wrap table-wrap-compacta">
          <table>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th />
              </tr>
            </thead>
            <TabelaFornecedores
              fornecedores={metas.fornecedores}
              aoEditar={(fornecedor) => setDialogoFornecedor({ aberto: true, fornecedor })}
              aoExcluir={excluirFornecedor}
            />
          </table>

          {!metas.fornecedores.length ? (
            <EstadoVazio titulo="Nenhum fornecedor cadastrado" texto="Cadastre os fornecedores donos das metas.">
              <button
                className="btn btn-primary"
                onClick={() => setDialogoFornecedor({ aberto: true, fornecedor: null })}
              >
                + Cadastrar fornecedor
              </button>
            </EstadoVazio>
          ) : null}
        </div>
      ) : subaba === 'representantes' ? (
        <div className="table-wrap table-wrap-compacta">
          <table>
            <thead>
              <tr>
                <th>Representante</th>
                <th>Fornecedores</th>
                <th>E-mail</th>
                <th>Celular</th>
                <th />
              </tr>
            </thead>
            <TabelaRepresentantes
              representantes={metas.representantes}
              aoEditar={(representante) => setDialogoRepresentante({ aberto: true, representante })}
              aoExcluir={excluirRepresentante}
            />
          </table>

          {!metas.representantes.length ? (
            <EstadoVazio titulo="Nenhum representante cadastrado" texto="Cadastre os representantes que terão metas atribuídas.">
              <button className="btn btn-primary" onClick={() => setDialogoRepresentante({ aberto: true, representante: null })}>
                + Cadastrar representante
              </button>
            </EstadoVazio>
          ) : null}
        </div>
      ) : subaba === 'metas' ? (
        <>
          {metas.metas.length > 1 ? (
            <p className="hint consulta-info">
              Use ↑ e ↓ pra mudar a ordem (dá também direto em Meta Representante): é nessa ordem que as metas aparecem
              em Meta Representante e Meta Fornecedor. Meta que não vale mais dá pra ocultar em vez de excluir: ela some
              das consultas dos meses em que não tem valor, mas continua nos meses em que valeu.
            </p>
          ) : null}

          {quantasOcultas ? (
            <label className="metas-ocultas-check">
              <input type="checkbox" checked={verOcultas} onChange={(e) => setVerOcultas(e.target.checked)} />
              Mostrar metas ocultas ({quantasOcultas})
            </label>
          ) : null}

          <div className="table-wrap table-wrap-compacta">
            <table>
              <thead>
                <tr>
                  <th>Meta</th>
                  <th>Fornecedor</th>
                  <th>Unidade</th>
                  <th />
                </tr>
              </thead>
              <TabelaMetas
                metas={metasNaLista}
                aoEditar={(meta) => setDialogoMeta({ aberto: true, meta })}
                aoExcluir={excluirMeta}
                aoOcultar={(meta, oculta) => metas.ocultarMeta(meta.id, oculta)}
                aoTrocarOrdem={(meta, vizinha) => metas.trocarOrdemMetas(meta.id, vizinha.id)}
              />
            </table>

            {!metas.metas.length ? (
              <EstadoVazio titulo="Nenhuma meta cadastrada" texto="Cadastre as metas de cada fornecedor.">
                <button className="btn btn-primary" onClick={() => setDialogoMeta({ aberto: true, meta: null })}>
                  + Cadastrar meta
                </button>
              </EstadoVazio>
            ) : null}
          </div>
        </>
      ) : subaba === 'porRepresentante' ? (
        <ConsultaMetasPorRepresentante
          representantes={metas.representantes}
          metas={metasNaConsulta}
          metasRepresentante={metas.metasRepresentante}
          totaisVendidos={metas.totaisVendidos}
          mes={mes}
          aoMudarMes={setMes}
          aoTrocarOrdem={isAdmin ? (meta, vizinha) => metas.trocarOrdemMetas(meta.id, vizinha.id) : undefined}
        />
      ) : (
        <ConsultaMetasPorFornecedor
          fornecedores={
            isAdmin
              ? metas.fornecedores
              : // Representante só recebe ele mesmo da API: mostra só os fornecedores pra quem ele trabalha.
                metas.fornecedores.filter((f) => metas.representantes.some((r) => r.fornecedores.some((rf) => rf.id === f.id)))
          }
          representantes={metas.representantes}
          metas={metasNaConsulta}
          metasRepresentante={metas.metasRepresentante}
          mes={mes}
          aoMudarMes={setMes}
          aoSalvar={isAdmin ? metas.salvarMetaRepresentante : undefined}
          aoCopiarMes={isAdmin ? metas.copiarMetasDoMes : undefined}
        />
      )}

      {metas.sincronizando ? (
        <CarregandoTelaInteira texto="Sincronizando com a ADS… isso pode levar alguns minutos." />
      ) : null}

      {dialogoFornecedor.aberto ? (
        <FormularioFornecedor
          fornecedor={dialogoFornecedor.fornecedor}
          aoFechar={() => setDialogoFornecedor({ aberto: false, fornecedor: null })}
          aoSalvar={metas.salvarFornecedor}
        />
      ) : null}

      {dialogoRepresentante.aberto ? (
        <FormularioRepresentante
          representante={dialogoRepresentante.representante}
          fornecedores={metas.fornecedores}
          aoFechar={() => setDialogoRepresentante({ aberto: false, representante: null })}
          aoSalvar={metas.salvarRepresentante}
        />
      ) : null}

      {dialogoMeta.aberto ? (
        <FormularioMeta
          meta={dialogoMeta.meta}
          fornecedores={metas.fornecedores}
          aoFechar={() => setDialogoMeta({ aberto: false, meta: null })}
          aoSalvar={metas.salvarMeta}
        />
      ) : null}
    </section>
  )
}
