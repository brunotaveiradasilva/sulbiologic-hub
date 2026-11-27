import { useState } from 'react'
import {
  subabasCadastros,
  type SubabaCadastros,
  type SubabaCampanhas,
  type SubabaDados,
  type SubabaMetas,
} from './navegacao'
import { AbasCadastros } from './AbasCadastros'
import { CadastrosMetas } from '../features/cadastros/CadastrosMetas'
import { MinhaConta } from '../features/usuarios/MinhaConta'
import { PainelUsuarios } from '../features/usuarios/PainelUsuarios'
import { PainelMetas } from '../features/metas/PainelMetas'
import { PainelCampanhas } from '../features/campanhas/PainelCampanhas'
import { PainelDados } from '../features/dados/PainelDados'
import { MenuLateral, type AbaPrincipal } from './MenuLateral'
import { BarraTopo } from './BarraTopo'
import { PaginaInicial, type Destino } from './PaginaInicial'
import type { MeuLogin, MeusDados } from '../types'

interface Props {
  usuario: string
  /** Nome cadastrado da pessoa (ou o login, se não tiver), pra saudação e menu. */
  nomeExibido: string
  isAdmin: boolean
  /** Supervisor e representante também veem Metas e Campanhas, só pra consultar. */
  consultaMetas: boolean
  /** Todo mundo menos o representante vê o atalho pro Retira (onde agora ficam os materiais). */
  veAlmoxarifado: boolean
  avatar: string | null
  aoSair: () => void
  aoTrocarFoto: (avatar: string | null) => Promise<void>
  aoSalvarDados: (dados: MeusDados) => Promise<MeuLogin>
}

/** Tudo que só existe depois do login: só monta (e só busca dados da API) quem já está autenticado. */
export function PainelHub({
  usuario,
  nomeExibido,
  isAdmin,
  consultaMetas,
  veAlmoxarifado,
  avatar,
  aoSair,
  aoTrocarFoto,
  aoSalvarDados,
}: Props) {
  const [aba, setAba] = useState<AbaPrincipal>('inicio')
  const [subabaMetas, setSubabaMetas] = useState<SubabaMetas>('porRepresentante')
  const [subabaCampanhas, setSubabaCampanhas] = useState<SubabaCampanhas>('especialistaPet')
  const [subabaDados, setSubabaDados] = useState<SubabaDados>('comparativo')
  const [subabaCadastros, setSubabaCadastros] = useState<SubabaCadastros>(
    () => subabasCadastros(isAdmin)[0]?.valor ?? 'fornecedores',
  )

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

  const abasCadastros = <AbasCadastros subaba={subabaCadastros} aoMudarSubaba={setSubabaCadastros} isAdmin={isAdmin} />

  return (
    <div className="app-shell">
      <BarraTopo aba={aba} />
      <main>
        {aba === 'metas' ? (
          <PainelMetas subaba={subabaMetas} aoMudarSubaba={setSubabaMetas} isAdmin={isAdmin} />
        ) : aba === 'campanhas' ? (
          <PainelCampanhas subaba={subabaCampanhas} aoMudarSubaba={setSubabaCampanhas} isAdmin={isAdmin} />
        ) : aba === 'dados' ? (
          <PainelDados subaba={subabaDados} aoMudarSubaba={setSubabaDados} />
        ) : aba === 'cadastros' && subabaCadastros === 'usuarios' ? (
          <PainelUsuarios usuarioAtual={usuario} abas={abasCadastros} />
        ) : aba === 'cadastros' && subabaCadastros !== 'usuarios' ? (
          <CadastrosMetas subaba={subabaCadastros} abas={abasCadastros} />
        ) : aba === 'conta' ? (
          <MinhaConta avatar={avatar} aoTrocarFoto={aoTrocarFoto} aoSalvarDados={aoSalvarDados} />
        ) : (
          <PaginaInicial
            nome={nomeExibido}
            isAdmin={isAdmin}
            consultaMetas={consultaMetas}
            veAlmoxarifado={veAlmoxarifado}
            aoAbrir={abrirDestino}
          />
        )}
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
    </div>
  )
}
