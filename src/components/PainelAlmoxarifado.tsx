import { useMemo, useState } from 'react'
import { useAlmoxarifado } from '../hooks/useAlmoxarifado'
import { calcularResumo, filtrarAgendamentos } from '../lib/regras'
import {
  SUBABAS_MATERIAIS,
  type SubabaCampanhas,
  type SubabaDados,
  type SubabaMateriais,
  type SubabaMetas,
} from '../lib/navegacao'
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
import type { Agendamento, Filtro, Material } from '../types'

interface Props {
  usuario: string
  isAdmin: boolean
  /** Supervisor e representante também veem Metas e Campanhas, só pra consultar. */
  consultaMetas: boolean
  avatar: string | null
  aoSair: () => void
  aoTrocarFoto: (avatar: string | null) => Promise<void>
}

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'atrasado', rotulo: 'Atrasados' },
  { valor: 'agendado', rotulo: 'Agendados' },
  { valor: 'retirado', rotulo: 'Em posse' },
  { valor: 'devolvido', rotulo: 'Devolvidos' },
]

/** Tudo que só existe depois do login: só monta (e só busca dados da API) quem já está autenticado. */
export function PainelAlmoxarifado({ usuario, isAdmin, consultaMetas, avatar, aoSair, aoTrocarFoto }: Props) {
  const app = useAlmoxarifado()

  const [aba, setAba] = useState<AbaPrincipal>('inicio')
  const [subabaMateriais, setSubabaMateriais] = useState<SubabaMateriais>('agendamentos')
  // Os cadastros (fornecedores, representantes, metas) são só do admin: os outros começam na consulta.
  const [subabaMetas, setSubabaMetas] = useState<SubabaMetas>(isAdmin ? 'fornecedores' : 'porRepresentante')
  const [subabaCampanhas, setSubabaCampanhas] = useState<SubabaCampanhas>('especialistaPet')
  const [subabaDados, setSubabaDados] = useState<SubabaDados>('comparativo')
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

  const [dialogoConta, setDialogoConta] = useState(false)
  const [dialogoUsuarios, setDialogoUsuarios] = useState(false)

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
      setAba('materiais')
      setSubabaMateriais('cadastro')
      setDialogoMaterial({ aberto: true, material: null })
      return
    }
    setDialogoAgendamento({ aberto: true, agendamento, materialInicial })
  }

  /** Atalho da página inicial: vai pra seção já na subaba escolhida. */
  function abrirDestino(destino: Destino) {
    if (destino.aba === 'materiais') setSubabaMateriais(destino.subaba)
    else if (destino.aba === 'metas') setSubabaMetas(destino.subaba)
    else if (destino.aba === 'campanhas') setSubabaCampanhas(destino.subaba)
    else setSubabaDados(destino.subaba)
    setAba(destino.aba)
  }

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
            usuario={usuario}
            isAdmin={isAdmin}
            consultaMetas={consultaMetas}
            resumo={resumo}
            aoAbrir={abrirDestino}
          />
        ) : primeiraCarga ? (
          <EstadoVazio titulo="Carregando…" texto="Buscando os dados salvos no servidor." />
        ) : aba === 'metas' ? (
          <PainelMetas subaba={subabaMetas} aoMudarSubaba={setSubabaMetas} isAdmin={isAdmin} />
        ) : aba === 'campanhas' ? (
          <PainelCampanhas subaba={subabaCampanhas} aoMudarSubaba={setSubabaCampanhas} isAdmin={isAdmin} />
        ) : aba === 'dados' ? (
          <PainelDados subaba={subabaDados} aoMudarSubaba={setSubabaDados} />
        ) : (
          <section className="view" role="tabpanel">
            <div className="view-head">
              <div>
                <h2>Materiais</h2>
                <p>
                  Quem levou o quê e o que existe no estoque para retirar. Itens com devolução vencida sobem
                  marcados como atrasados.
                </p>
              </div>
              {subabaMateriais === 'agendamentos' ? (
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

            {/* A navegação entre as subabas fica no menu lateral; essas abas só aparecem no celular. */}
            <nav className="tabs tabs-so-celular" role="tablist">
              {SUBABAS_MATERIAIS.map((s) => (
                <button
                  key={s.valor}
                  role="tab"
                  aria-selected={subabaMateriais === s.valor}
                  onClick={() => setSubabaMateriais(s.valor)}
                >
                  {s.rotulo}
                </button>
              ))}
            </nav>

            {subabaMateriais === 'agendamentos' ? (
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
                        setSubabaMateriais('agendamentos')
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

        {aba === 'materiais' ? (
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
        usuario={usuario}
        avatar={avatar}
        aoMudarAba={setAba}
        subabaMateriais={subabaMateriais}
        aoMudarSubabaMateriais={setSubabaMateriais}
        subabaMetas={subabaMetas}
        aoMudarSubabaMetas={setSubabaMetas}
        subabaCampanhas={subabaCampanhas}
        aoMudarSubabaCampanhas={setSubabaCampanhas}
        subabaDados={subabaDados}
        aoMudarSubabaDados={setSubabaDados}
        aoAbrirUsuarios={() => setDialogoUsuarios(true)}
        aoAbrirConta={() => setDialogoConta(true)}
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

      {dialogoConta ? (
        <MinhaConta
          usuario={usuario}
          avatar={avatar}
          aoTrocarFoto={aoTrocarFoto}
          aoFechar={() => setDialogoConta(false)}
        />
      ) : null}

      {dialogoUsuarios ? (
        <PainelUsuarios usuarioAtual={usuario} aoFechar={() => setDialogoUsuarios(false)} />
      ) : null}
    </div>
  )
}
