import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi } from '../lib/api'
import type { ClienteCampanhaWellpet } from '../types'

function mensagemErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.'
}

/** Clientes da campanha Wellpet, de todos os meses, com a montagem da lista e a sincronização com a ADS. */
export function useCampanhaWellpet() {
  const [clientes, setClientes] = useState<ClienteCampanhaWellpet[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState<'montando' | 'sincronizando' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  /** 0 a 100 enquanto monta ou sincroniza; null fora disso. */
  const [progresso, setProgresso] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setClientes(await api.listarCampanhaWellpet())
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  /** Troca os clientes do mês pelos que vieram no retorno da API. */
  const substituirMes = useCallback((mes: string, doMes: ClienteCampanhaWellpet[]) => {
    setClientes((atual) => [...atual.filter((c) => c.mes !== mes), ...doMes])
  }, [])

  /**
   * Roda uma chamada demorada na ADS perguntando a cada segundo quanto já foi. Falha na pergunta não
   * importa, só deixa a barra parada. Devolve false se a chamada falhou.
   */
  const comProgresso = useCallback(
    async (mes: string, etapa: 'montando' | 'sincronizando', chamada: () => Promise<ClienteCampanhaWellpet[]>) => {
      setErro(null)
      setOcupado(etapa)
      setProgresso(0)
      let emAndamento = true
      const acompanhar = setInterval(async () => {
        try {
          const p = await api.progressoCampanhaWellpet(mes)
          // Resposta que chega depois de terminar não traz a barra de volta.
          if (p !== null && emAndamento) setProgresso((atual) => Math.max(atual ?? 0, p))
        } catch {
          // ignora
        }
      }, 1000)
      try {
        substituirMes(mes, await chamada())
        return true
      } catch (e) {
        setErro(mensagemErro(e))
        return false
      } finally {
        emAndamento = false
        clearInterval(acompanhar)
        setOcupado(null)
        setProgresso(null)
      }
    },
    [substituirMes],
  )

  const sincronizar = useCallback(
    (mes: string) => comProgresso(mes, 'sincronizando', () => api.sincronizarCampanhaWellpet(mes)),
    [comProgresso],
  )

  /** Monta a lista do mês a partir do histórico da ADS e já busca quem positivou. */
  const montar = useCallback(
    async (mes: string) => {
      if (await comProgresso(mes, 'montando', () => api.montarCampanhaWellpet(mes))) await sincronizar(mes)
    },
    [comProgresso, sincronizar],
  )

  return { clientes, carregando, ocupado, progresso, erro, tentarNovamente: carregar, montar, sincronizar }
}
