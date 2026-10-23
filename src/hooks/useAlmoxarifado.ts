import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi } from '../lib/api'
import { idTemporario } from '../lib/idTemporario'
import { criarExemplos } from '../data/exemplos'
import type { Agendamento, Dados, Material, Status } from '../types'

const DADOS_VAZIOS: Dados = { materiais: [], agendamentos: [] }

function mensagemErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.'
}

/**
 * Estado único do app: materiais, agendamentos e as ações que os alteram.
 * Cada ação atualiza a tela na hora (otimista) e confirma com a API em seguida;
 * se a API recusar, a mudança é desfeita e o erro aparece no rodapé.
 * ativo=false (login de representante, que não vê o almoxarifado) não busca nada.
 */
export function useAlmoxarifado(ativo = true) {
  const [dados, setDados] = useState<Dados>(DADOS_VAZIOS)
  const [carregando, setCarregando] = useState(ativo)
  const [erro, setErro] = useState<string | null>(null)

  const carregarTudo = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [materiais, agendamentos] = await Promise.all([api.listarMateriais(), api.listarAgendamentos()])
      setDados({ materiais, agendamentos })
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (ativo) carregarTudo()
  }, [ativo, carregarTudo])

  const salvarMaterial = useCallback((material: Omit<Material, 'id'>, id?: string | null) => {
    setErro(null)

    if (id) {
      const anterior = dados.materiais
      // Otimista com o que foi digitado, mas o código é gerado/mantido pelo servidor:
      // só a resposta da API tem o valor de verdade, então ela substitui a linha ao chegar.
      setDados((atual) => ({
        ...atual,
        materiais: atual.materiais.map((m) => (m.id === id ? { ...m, ...material } : m)),
      }))
      api
        .atualizarMaterial(id, material)
        .then((atualizado) => {
          setDados((atual) => ({
            ...atual,
            materiais: atual.materiais.map((m) => (m.id === id ? atualizado : m)),
          }))
        })
        .catch((e) => {
          setErro(mensagemErro(e))
          setDados((atual) => ({ ...atual, materiais: anterior }))
        })
      return
    }

    const provisorio = idTemporario()
    setDados((atual) => ({ ...atual, materiais: [...atual.materiais, { ...material, id: provisorio }] }))
    api
      .criarMaterial(material)
      .then((criado) => {
        setDados((atual) => ({
          ...atual,
          materiais: atual.materiais.map((m) => (m.id === provisorio ? criado : m)),
        }))
      })
      .catch((e) => {
        setErro(mensagemErro(e))
        setDados((atual) => ({ ...atual, materiais: atual.materiais.filter((m) => m.id !== provisorio) }))
      })
  }, [dados.materiais])

  const removerMaterial = useCallback((id: string) => {
    setErro(null)
    const anterior = dados.materiais
    setDados((atual) => ({ ...atual, materiais: atual.materiais.filter((m) => m.id !== id) }))
    api.excluirMaterial(id).catch((e) => {
      setErro(mensagemErro(e))
      setDados((atual) => ({ ...atual, materiais: anterior }))
    })
  }, [dados.materiais])

  const salvarAgendamento = useCallback(
    (agendamento: Omit<Agendamento, 'id'>, id?: string | null) => {
      setErro(null)

      if (id) {
        setDados((atual) => ({
          ...atual,
          agendamentos: atual.agendamentos.map((a) => (a.id === id ? { ...a, ...agendamento } : a)),
        }))
        api.atualizarAgendamento(id, agendamento).catch((e) => {
          setErro(mensagemErro(e))
          carregarTudo()
        })
        return
      }

      const provisorio = idTemporario()
      setDados((atual) => ({
        ...atual,
        agendamentos: [...atual.agendamentos, { ...agendamento, id: provisorio }],
      }))
      api
        .criarAgendamento(agendamento)
        .then((criado) => {
          setDados((atual) => ({
            ...atual,
            agendamentos: atual.agendamentos.map((a) => (a.id === provisorio ? criado : a)),
          }))
        })
        .catch((e) => {
          setErro(mensagemErro(e))
          setDados((atual) => ({
            ...atual,
            agendamentos: atual.agendamentos.filter((a) => a.id !== provisorio),
          }))
        })
    },
    [carregarTudo],
  )

  const removerAgendamento = useCallback((id: string) => {
    setErro(null)
    const anterior = dados.agendamentos
    setDados((atual) => ({ ...atual, agendamentos: atual.agendamentos.filter((a) => a.id !== id) }))
    api.excluirAgendamento(id).catch((e) => {
      setErro(mensagemErro(e))
      setDados((atual) => ({ ...atual, agendamentos: anterior }))
    })
  }, [dados.agendamentos])

  const definirStatus = useCallback((id: string, status: Status) => {
    setErro(null)
    const anterior = dados.agendamentos
    setDados((atual) => ({
      ...atual,
      agendamentos: atual.agendamentos.map((a) => (a.id === id ? { ...a, status } : a)),
    }))
    api.definirStatusAgendamento(id, status).catch((e) => {
      setErro(mensagemErro(e))
      setDados((atual) => ({ ...atual, agendamentos: anterior }))
    })
  }, [dados.agendamentos])

  const carregarExemplos = useCallback(async () => {
    setErro(null)
    try {
      const exemplo = criarExemplos()
      const materiaisCriados = await Promise.all(exemplo.materiais.map((m) => api.criarMaterial(m)))
      const agendamentosCriados = await Promise.all(
        exemplo.agendamentos.map(({ materialIndex, ...resto }) =>
          api.criarAgendamento({ ...resto, materialId: materiaisCriados[materialIndex].id }),
        ),
      )
      setDados((atual) => ({
        materiais: [...atual.materiais, ...materiaisCriados],
        agendamentos: [...atual.agendamentos, ...agendamentosCriados],
      }))
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }, [])

  return {
    materiais: dados.materiais,
    agendamentos: dados.agendamentos,
    carregando,
    erro,
    tentarNovamente: carregarTudo,
    salvarMaterial,
    removerMaterial,
    salvarAgendamento,
    removerAgendamento,
    definirStatus,
    carregarExemplos,
  }
}
