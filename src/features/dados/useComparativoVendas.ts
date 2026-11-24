import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../../api/api'
import { ErroApi } from '../../api/api'
import type { Periodo } from './comparativo'
import type { Fornecedor, Representante, VendasPeriodo } from '../../types'

function mensagemErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.'
}

/** O que foi pedido na última busca — a tela compara com os filtros atuais pra avisar que mudaram. */
export interface ConsultaVendas {
  atual: Periodo
  anterior: Periodo
  /** Vazio = todos. */
  representanteIds: string[]
  /** Vazio = todos. */
  fornecedorIds: string[]
}

/**
 * Vendas dos dois períodos comparados na aba Dados, direto da ADS. Só busca quando a tela chama
 * `buscar` (botão Buscar) — a ADS é lenta, então mudar um filtro não sai consultando sozinho.
 * Enquanto busca, mantém o resultado anterior na tela.
 */
export function useComparativoVendas() {
  const [resultado, setResultado] = useState<{
    consulta: ConsultaVendas
    atual: VendasPeriodo
    anterior: VendasPeriodo
  } | null>(null)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ultimaBusca = useRef(0)

  // Os filtros só oferecem quem dá pra buscar na ADS: representante sem código ADS fica de fora.
  useEffect(() => {
    const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, 'pt-BR')
    Promise.all([api.listarFornecedores(), api.listarRepresentantes()])
      .then(([fornecedoresCarregados, representantesCarregados]) => {
        setFornecedores([...fornecedoresCarregados].sort(porNome))
        setRepresentantes(representantesCarregados.filter((r) => r.codigoAds.trim()).sort(porNome))
      })
      .catch((e) => setErro(mensagemErro(e)))
  }, [])

  const buscar = useCallback(async (consulta: ConsultaVendas) => {
    const busca = ++ultimaBusca.current
    setCarregando(true)
    setErro(null)
    const filtros = { representanteIds: consulta.representanteIds, fornecedorIds: consulta.fornecedorIds }
    try {
      const [atual, anterior] = await Promise.all([
        api.buscarVendasPeriodo(consulta.atual.inicio, consulta.atual.fim, filtros),
        api.buscarVendasPeriodo(consulta.anterior.inicio, consulta.anterior.fim, filtros),
      ])
      if (busca === ultimaBusca.current) setResultado({ consulta, atual, anterior })
    } catch (e) {
      if (busca === ultimaBusca.current) setErro(mensagemErro(e))
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false)
    }
  }, [])

  return { resultado, fornecedores, representantes, carregando, erro, buscar }
}
