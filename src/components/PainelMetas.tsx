import { useMemo, useState } from 'react'
import { useMetas } from '../hooks/useMetas'
import { CarregandoTelaInteira } from './CarregandoTelaInteira'
import { EstadoVazio } from './EstadoVazio'
import { ConsultaMetasPorRepresentante } from './ConsultaMetasPorRepresentante'
import { ConsultaMetasPorFornecedor } from './ConsultaMetasPorFornecedor'
import { mesAtual } from '../lib/mes'
import { metasDoMes } from '../lib/metaOculta'
import { SUBABAS_METAS, type SubabaMetas } from '../lib/navegacao'

/**
 * Acompanhamento das metas do mês, por representante e por fornecedor. Os cadastros (fornecedores,
 * representantes e metas) ficam em Cadastros. Sem isAdmin, só consulta e sem editar nada
 * (supervisor e representante; a API já manda pro representante só o que é dele).
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
  const metasNaConsulta = useMemo(
    () => metasDoMes(metas.metas, metas.metasRepresentante, mes),
    [metas.metas, metas.metasRepresentante, mes],
  )

  const primeiraCarga =
    metas.carregando && !metas.fornecedores.length && !metas.representantes.length && !metas.metas.length

  return (
    <section className="view" role="tabpanel">
      <div className="view-head">
        <div>
          <h2>Metas</h2>
        </div>
        {isAdmin ? (
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
        {SUBABAS_METAS.map((s) => (
          <button key={s.valor} role="tab" aria-selected={subaba === s.valor} onClick={() => aoMudarSubaba(s.valor)}>
            {s.rotulo}
          </button>
        ))}
      </nav>

      {primeiraCarga ? (
        <EstadoVazio titulo="Carregando…" texto="Buscando os dados salvos no servidor." />
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
    </section>
  )
}
