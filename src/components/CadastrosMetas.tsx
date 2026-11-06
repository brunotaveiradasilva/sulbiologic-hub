import { useState, type ReactNode } from 'react'
import { useMetas } from '../hooks/useMetas'
import { EstadoVazio } from './EstadoVazio'
import { TabelaFornecedores } from './TabelaFornecedores'
import { FormularioFornecedor } from './FormularioFornecedor'
import { TabelaRepresentantes } from './TabelaRepresentantes'
import { FormularioRepresentante } from './FormularioRepresentante'
import { TabelaMetas } from './TabelaMetas'
import { FormularioMeta } from './FormularioMeta'
import type { Fornecedor, Meta, Representante } from '../types'

interface Props {
  subaba: 'fornecedores' | 'representantes' | 'metas'
  /** Abas entre os cadastros, pro celular. */
  abas: ReactNode
}

const TITULOS = {
  fornecedores: {
    titulo: 'Fornecedores',
    texto: 'Os fornecedores donos das metas.',
  },
  representantes: {
    titulo: 'Representantes',
    texto: 'Os representantes que têm metas, com os fornecedores pra quem cada um trabalha.',
  },
  metas: {
    titulo: 'Metas',
    texto: 'As metas de cada fornecedor. Os valores do mês se lançam em Metas › Meta Fornecedor.',
  },
}

/** Cadastros de apoio às metas (só admin): fornecedores, representantes e as metas em si. */
export function CadastrosMetas({ subaba, abas }: Props) {
  const metas = useMetas()
  // As metas ocultas ficam escondidas até marcar "Mostrar metas ocultas".
  const [verOcultas, setVerOcultas] = useState(false)
  const quantasOcultas = metas.metas.filter((m) => m.oculta).length
  const metasNaLista = verOcultas ? metas.metas : metas.metas.filter((m) => !m.oculta)

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
          <h2>{TITULOS[subaba].titulo}</h2>
          <p>{TITULOS[subaba].texto}</p>
        </div>
        {subaba === 'fornecedores' ? (
          <button className="btn btn-primary" onClick={() => setDialogoFornecedor({ aberto: true, fornecedor: null })}>
            + Cadastrar fornecedor
          </button>
        ) : subaba === 'representantes' ? (
          <button className="btn btn-primary" onClick={() => setDialogoRepresentante({ aberto: true, representante: null })}>
            + Cadastrar representante
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setDialogoMeta({ aberto: true, meta: null })}>
            + Cadastrar meta
          </button>
        )}
      </div>

      {metas.erro ? (
        <div className="banner-erro" role="alert">
          <span>{metas.erro}</span>
          <button className="btn" onClick={metas.tentarNovamente}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      {abas}

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
      ) : (
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
      )}

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
