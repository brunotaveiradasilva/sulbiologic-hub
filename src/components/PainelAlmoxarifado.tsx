import { useMemo, useState } from 'react'
import { useAlmoxarifado } from '../hooks/useAlmoxarifado'
import { calcularResumo, filtrarAgendamentos } from '../lib/regras'
import {
  subabasCadastros,
  type SubabaCadastros,
  type SubabaCampanhas,
  type SubabaDados,
  type SubabaMetas,
} from '../lib/navegacao'
import { AbasCadastros } from './AbasCadastros'
import { CadastrosMetas } from './CadastrosMetas'
import { PainelResumo } from './PainelResumo'
import { EstadoVazio } from './EstadoVazio'
import { TabelaAgendamentos } from './TabelaAgendamentos'
import { TabelaMateriais } from './TabelaMateriais'
import { DetalhesAgendamento } from './DetalhesAgendamento'
import { FormularioAgendamento } from './FormularioAgendamento'
import { FormularioMaterial } from './FormularioMaterial'
import { MinhaConta } from './MinhaConta'
import { PainelUsuarios } from './PainelUsuarios'
import { PainelMetas } from './PainelMetas'
import { PainelCampanhas } from './PainelCampanhas'
import { PainelDados } from './PainelDados'
import { MenuLateral, type AbaPrincipal } from './MenuLateral'
import { PaginaInicial, type Destino } from './PaginaInicial'
import type { Agendamento, Filtro, Material, MeuLogin, MeusDados } from '../types'

interface Props {
  usuario: string
  /** Nome cadastrado da pessoa (ou o login, se não tiver), pra saudação e menu. */
  nomeExibido: string
  isAdmin: boolean
  sincronizaEspecialistaPet: boolean
  /** Supervisor e representante também veem Metas e Campanhas, só pra consultar. */
  consultaMetas: boolean
  /** Representante não vê Materiais (nem busca esses dados). */
  veAlmoxarifado: boolean
  avatar: string | null
  aoSair: () => void
  aoTrocarFoto: (avatar: string | null) => Promise<void>
  aoSalvarDados: (dados: MeusDados) => Promise<MeuLogin>
}

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'atrasado', rotulo: 'Atrasados' },
  { valor: 'agendado', rotulo: 'Agendados' },
  { valor: 'retirado', rotulo: 'Em posse' },
  { valor: 'devolvido', rotulo: 'Devolvidos' },
]

/** Tudo que só existe depois do login: só monta (e só busca dados da API) quem já está autenticado. */
export function PainelAlmoxarifado({
  usuario,
  nomeExibido,
  isAdmin,
  sincronizaEspecialistaPet,
  consultaMetas,
  veAlmoxarifado,
  avatar,
  aoSair,
  aoTrocarFoto,
  aoSalvarDados,
}: Props) {
  const app = useAlmoxarifado(veAlmoxarifado)

  const [aba, setAba] = useState<AbaPrincipal>('inicio')
  const [subabaMetas, setSubabaMetas] = useState<SubabaMetas>('porRepresentante')
  const [subabaCampanhas, setSubabaCampanhas] = useState<SubabaCampanhas>('especialistaPet')
  const [subabaDados, setSubabaDados] = useState<SubabaDados>('comparativo')
  const [subabaCadastros, setSubabaCadastros] = useState<SubabaCadastros>(
    () => subabasCadastros(isAdmin, veAlmoxarifado)[0]?.valor ?? 'materiais',
  )
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [buscaAgenda, setBuscaAgenda] = useState('')
  const [buscaMaterial, setBuscaMaterial] = useState('')

  const [dialogoAgendamento, setDialogoAgendamento] = useState<{
    aberto: boolean
    agendamento: Agendamento | null
    materialInicial?: string
  }>({ aberto: false, agendamento: null })

  const [detalhesAgendamento, setDetalhesAgendamento] = useState<Agendamento | null>(null)

  const [dialogoMaterial, setDialogoMaterial] = useState<{ aberto: boolean; material: Material | null }>({
    aberto: false,
    material: null,
  })


  const primeiraCarga = app.carregando && !app.materiais.length && !app.agendamentos.length

  const resumo = useMemo(() => calcularResumo(app.agendamentos), [app.agendamentos])

  const agendamentosVisiveis = useMemo(
    () => filtrarAgendamentos(app.agendamentos, app.materiais, filtro, buscaAgenda),
    [app.agendamentos, app.materiais, filtro, buscaAgenda],
  )

  const materiaisOrdenados = useMemo(
    () => [...app.materiais].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [app.materiais],
  )

  const materiaisVisiveis = useMemo(() => {
    const termo = buscaMaterial.trim().toLowerCase()
    return materiaisOrdenados.filter((m) => !termo || `${m.nome} ${m.codigo}`.toLowerCase().includes(termo))
  }, [materiaisOrdenados, buscaMaterial])

  function abrirAgendamento(agendamento: Agendamento | null, materialInicial?: string) {
    if (!app.materiais.length) {
      setAba('cadastros')
      setSubabaCadastros('materiais')
      setDialogoMaterial({ aberto: true, material: null })
      return
    }
    setDialogoAgendamento({ aberto: true, agendamento, materialInicial })
  }

  /** Atalho da página inicial: vai pra seção já na subaba escolhida. */
  function abrirDestino(destino: Destino) {
    if (destino.aba === 'metas') setSubabaMetas(destino.subaba)
    else if (destino.aba === 'campanhas') setSubabaCampanhas(destino.subaba)
    else if (destino.aba === 'dados') setSubabaDados(destino.subaba)
    else if (destino.aba === 'cadastros') setSubabaCadastros(destino.subaba)
    setAba(destino.aba)
  }

  function abrirCadastro(subaba: SubabaCadastros) {
    setSubabaCadastros(subaba)
    setAba('cadastros')
  }

  const abasCadastros = (
    <AbasCadastros
      subaba={subabaCadastros}
      aoMudarSubaba={setSubabaCadastros}
      isAdmin={isAdmin}
      veAlmoxarifado={veAlmoxarifado}
    />
  )

  function excluirMaterial(material: Material) {
    const usos = app.agendamentos.filter((a) => a.materialId === material.id).length
    const aviso = `Este material tem ${usos} agendamento(s). Excluir mesmo assim? Os agendamentos continuam na lista, sem o material.`
    if (usos && !window.confirm(aviso)) return
    app.removerMaterial(material.id)
  }

  return (
    <div className="app-shell">
      <main>
        {app.erro ? (
          <div className="banner-erro" role="alert">
            <span>{app.erro}</span>
            <button className="btn" onClick={app.tentarNovamente}>
              Tentar de novo
            </button>
          </div>
        ) : null}

        {aba === 'inicio' ? (
          <PaginaInicial
            nome={nomeExibido}
            isAdmin={isAdmin}
            consultaMetas={consultaMetas}
            veAlmoxarifado={veAlmoxarifado}
            resumo={resumo}
            aoAbrir={abrirDestino}
          />
        ) : primeiraCarga ? (
          <EstadoVazio titulo="Carregando…" texto="Buscando os dados salvos no servidor." />
        ) : aba === 'metas' ? (
          <PainelMetas subaba={subabaMetas} aoMudarSubaba={setSubabaMetas} isAdmin={isAdmin} />
        ) : aba === 'campanhas' ? (
          <PainelCampanhas
            subaba={subabaCampanhas}
            aoMudarSubaba={setSubabaCampanhas}
            isAdmin={isAdmin}
            sincronizaEspecialistaPet={sincronizaEspecialistaPet}
          />
        ) : aba === 'dados' ? (
          <PainelDados subaba={subabaDados} aoMudarSubaba={setSubabaDados} />
        ) : aba === 'cadastros' && subabaCadastros === 'usuarios' ? (
          <PainelUsuarios usuarioAtual={usuario} abas={abasCadastros} />
        ) : aba === 'cadastros' &&
          (subabaCadastros === 'fornecedores' || subabaCadastros === 'representantes' || subabaCadastros === 'metas') ? (
          <CadastrosMetas subaba={subabaCadastros} abas={abasCadastros} />
        ) : aba === 'conta' ? (
          <MinhaConta avatar={avatar} aoTrocarFoto={aoTrocarFoto} aoSalvarDados={aoSalvarDados} />
        ) : (
          <section className="view" role="tabpanel">
            <div className="view-head">
              <div>
                <h2>Materiais</h2>
                <p>
                  {aba === 'materiais'
                    ? 'Quem levou o quê e quando devolve. Itens com devolução vencida sobem marcados como atrasados.'
                    : 'O que existe no almoxarifado para retirar, com a quantidade em estoque.'}
                </p>
              </div>
              {aba === 'materiais' ? (
                <button className="btn btn-primary" onClick={() => abrirAgendamento(null)}>
                  + Novo agendamento
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setDialogoMaterial({ aberto: true, material: null })}
                >
                  + Cadastrar material
                </button>
              )}
            </div>

            {aba === 'cadastros' ? abasCadastros : null}

            {aba === 'materiais' ? (
              <>
                <PainelResumo resumo={resumo} />

                <div className="toolbar">
                  <input
                    className="search"
                    type="search"
                    placeholder="Buscar por material, responsável, cliente ou observação…"
                    aria-label="Buscar agendamentos"
                    value={buscaAgenda}
                    onChange={(e) => setBuscaAgenda(e.target.value)}
                  />
                  <div className="filters">
                    {FILTROS.map((f) => (
                      <button key={f.valor} aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
                        {f.rotulo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th className="num">Qtd.</th>
                        <th>Responsável</th>
                        <th>Cliente</th>
                        <th>Retirada</th>
                        <th>Devolução</th>
                        <th>Status</th>
                        <th>Observação</th>
                        <th />
                      </tr>
                    </thead>
                    <TabelaAgendamentos
                      agendamentos={agendamentosVisiveis}
                      materiais={app.materiais}
                      aoMudarStatus={app.definirStatus}
                      aoVerDetalhes={setDetalhesAgendamento}
                      aoEditar={(a) => abrirAgendamento(a)}
                      aoExcluir={app.removerAgendamento}
                    />
                  </table>

                  {!agendamentosVisiveis.length && app.agendamentos.length ? (
                    <EstadoVazio titulo="Nada aqui com esses filtros" texto="Ajuste a busca ou volte para “Todos”." />
                  ) : null}

                  {!app.agendamentos.length ? (
                    <EstadoVazio
                      titulo={app.materiais.length ? 'Nenhum agendamento ainda' : 'Comece pelo cadastro de materiais'}
                      texto={
                        app.materiais.length
                          ? 'Registre a primeira retirada: material, quantidade, responsável e as duas datas.'
                          : 'Cadastre os materiais que podem ser retirados e depois agende as retiradas.'
                      }
                    >
                      <button className="btn btn-primary" onClick={() => abrirAgendamento(null)}>
                        {app.materiais.length ? '+ Novo agendamento' : '+ Cadastrar material'}
                      </button>
                      <button className="btn" onClick={app.carregarExemplos}>
                        Carregar dados de exemplo
                      </button>
                    </EstadoVazio>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="toolbar">
                  <input
                    className="search"
                    type="search"
                    placeholder="Buscar material por nome ou código…"
                    aria-label="Buscar materiais"
                    value={buscaMaterial}
                    onChange={(e) => setBuscaMaterial(e.target.value)}
                  />
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th className="num">Estoque</th>
                        <th className="num">Em posse / reservado</th>
                        <th>Observação</th>
                        <th />
                      </tr>
                    </thead>
                    <TabelaMateriais
                      materiais={materiaisVisiveis}
                      agendamentos={app.agendamentos}
                      aoAgendar={(materialId) => {
                        setAba('materiais')
                        abrirAgendamento(null, materialId)
                      }}
                      aoEditar={(material) => setDialogoMaterial({ aberto: true, material })}
                      aoExcluir={excluirMaterial}
                    />
                  </table>

                  {!materiaisVisiveis.length && app.materiais.length ? (
                    <EstadoVazio titulo="Nenhum material com esse termo" texto="Tente outro nome ou código." />
                  ) : null}

                  {!app.materiais.length ? (
                    <EstadoVazio
                      titulo="Nenhum material cadastrado"
                      texto="Cadastre os itens do almoxarifado — nome, código e quantidade em estoque. Depois eles aparecem na hora de agendar."
                    >
                      <button
                        className="btn btn-primary"
                        onClick={() => setDialogoMaterial({ aberto: true, material: null })}
                      >
                        + Cadastrar material
                      </button>
                      <button className="btn" onClick={app.carregarExemplos}>
                        Carregar dados de exemplo
                      </button>
                    </EstadoVazio>
                  ) : null}
                </div>
              </>
            )}
          </section>
        )}

        {aba === 'materiais' || (aba === 'cadastros' && subabaCadastros === 'materiais') ? (
          <footer className="foot">
            {app.materiais.length} material(is) cadastrado(s) · {app.agendamentos.length} agendamento(s). Os dados
            ficam no servidor — acessíveis de qualquer computador.
          </footer>
        ) : null}
      </main>

      <MenuLateral
        aba={aba}
        isAdmin={isAdmin}
        consultaMetas={consultaMetas}
        veAlmoxarifado={veAlmoxarifado}
        usuario={usuario}
        nomeExibido={nomeExibido}
        avatar={avatar}
        aoMudarAba={setAba}
        subabaMetas={subabaMetas}
        aoMudarSubabaMetas={setSubabaMetas}
        subabaCampanhas={subabaCampanhas}
        aoMudarSubabaCampanhas={setSubabaCampanhas}
        subabaDados={subabaDados}
        aoMudarSubabaDados={setSubabaDados}
        subabaCadastros={subabaCadastros}
        aoMudarSubabaCadastros={setSubabaCadastros}
        aoAbrirUsuarios={() => abrirCadastro('usuarios')}
        aoAbrirConta={() => setAba('conta')}
        aoSair={aoSair}
      />

      {detalhesAgendamento ? (
        <DetalhesAgendamento
          agendamento={detalhesAgendamento}
          materiais={app.materiais}
          aoFechar={() => setDetalhesAgendamento(null)}
          aoEditar={() => {
            const agendamento = detalhesAgendamento
            setDetalhesAgendamento(null)
            abrirAgendamento(agendamento)
          }}
          aoExcluir={() => app.removerAgendamento(detalhesAgendamento.id)}
          aoMudarStatus={app.definirStatus}
        />
      ) : null}

      {dialogoAgendamento.aberto ? (
        <FormularioAgendamento
          agendamento={dialogoAgendamento.agendamento}
          materialInicial={dialogoAgendamento.materialInicial}
          materiais={materiaisOrdenados}
          agendamentos={app.agendamentos}
          aoFechar={() => setDialogoAgendamento({ aberto: false, agendamento: null })}
          aoSalvar={app.salvarAgendamento}
        />
      ) : null}

      {dialogoMaterial.aberto ? (
        <FormularioMaterial
          material={dialogoMaterial.material}
          aoFechar={() => setDialogoMaterial({ aberto: false, material: null })}
          aoSalvar={app.salvarMaterial}
        />
      ) : null}

    </div>
  )
}
