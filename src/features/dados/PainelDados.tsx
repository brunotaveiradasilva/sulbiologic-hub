import { ConsultaComparativoVendas } from './ConsultaComparativoVendas'
import { SUBABAS_DADOS, type SubabaDados } from '../../app/navegacao'

interface Props {
  subaba: SubabaDados
  aoMudarSubaba: (subaba: SubabaDados) => void
}

/** Análises de vendas. A navegação entre as subabas fica no menu lateral; as abas daqui só aparecem no celular. */
export function PainelDados({ subaba, aoMudarSubaba }: Props) {
  return (
    <section className="view" role="tabpanel">
      <div className="view-head">
        <div>
          <h2>{SUBABAS_DADOS.find((s) => s.valor === subaba)?.rotulo ?? 'Dados'}</h2>
          <p>Vendas direto da ADS, de qualquer período — compare um representante com ele mesmo no mês anterior ou no ano passado.</p>
        </div>
      </div>

      <nav className="tabs tabs-so-celular" role="tablist">
        {SUBABAS_DADOS.map((s) => (
          <button key={s.valor} role="tab" aria-selected={subaba === s.valor} onClick={() => aoMudarSubaba(s.valor)}>
            {s.rotulo}
          </button>
        ))}
      </nav>

      {subaba === 'comparativo' ? <ConsultaComparativoVendas /> : null}
    </section>
  )
}
