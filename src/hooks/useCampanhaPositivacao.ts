import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi } from '../lib/api'
import type { ClienteCampanhaOrgannact, ClienteCampanhaWellpet } from '../types'

/** O que muda de uma campanha de positivação pra outra: as chamadas da API. */
export interface ApiCampanha<T> {
  listar: () => Promise<T[]>
  montar: (mes: string) => Promise<void>
  sincronizar: (mes: string) => Promise<T[]>
  progresso: (mes: string) => Promise<api.ProgressoCampanhaWellpet>
}

function mensagemErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.'
}

/**
 * Clientes de uma campanha de positivação (Wellpet, Organnact), de todos os meses, com a montagem da lista e
 * a sincronização com a ADS. `campanha` precisa ser estável (constante fora do componente).
 */
export function useCampanhaPositivacao<T extends { mes: string }>(campanha: ApiCampanha<T>) {
  const [clientes, setClientes] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState<'montando' | 'sincronizando' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  /** 0 a 100 enquanto monta ou sincroniza; null fora disso. */
  const [progresso, setProgresso] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setClientes(await campanha.listar())
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [campanha])

  useEffect(() => {
    carregar()
  }, [carregar])

  /** Troca os clientes do mês pelos que vieram no retorno da API. */
  const substituirMes = useCallback((mes: string, doMes: T[]) => {
    setClientes((atual) => [...atual.filter((c) => c.mes !== mes), ...doMes])
  }, [])

  /**
   * Busca na ADS quem da lista comprou no mês (leva menos de um minuto), perguntando a cada
   * segundo quanto já foi. Falha na pergunta não importa, só deixa a barra parada.
   */
  const sincronizar = useCallback(
    async (mes: string) => {
      setErro(null)
      setOcupado('sincronizando')
      setProgresso(0)
      let emAndamento = true
      const acompanhar = setInterval(async () => {
        try {
          const { percentual } = await campanha.progresso(mes)
          // Resposta que chega depois de terminar não traz a barra de volta.
          if (percentual !== null && emAndamento) setProgresso((atual) => Math.max(atual ?? 0, percentual))
        } catch {
          // ignora
        }
      }, 1000)
      try {
        substituirMes(mes, await campanha.sincronizar(mes))
      } catch (e) {
        setErro(mensagemErro(e))
      } finally {
        emAndamento = false
        clearInterval(acompanhar)
        setOcupado(null)
        setProgresso(null)
      }
    },
    [campanha, substituirMes],
  )

  /**
   * Monta a lista do mês a partir do histórico da ADS e já busca quem positivou. A montagem leva minutos
   * e roda no servidor: o pedido só a inicia, e daqui a tela pergunta o progresso até ela terminar.
   */
  const montar = useCallback(
    async (mes: string) => {
      setErro(null)
      setOcupado('montando')
      setProgresso(0)
      let terminouSemErro = false
      try {
        await campanha.montar(mes)
        for (;;) {
          await new Promise((ok) => setTimeout(ok, 2000))
          let p: api.ProgressoCampanhaWellpet
          try {
            p = await campanha.progresso(mes)
          } catch {
            continue // falha passageira na pergunta: tenta de novo no próximo ciclo
          }
          if (p.percentual !== null) {
            setProgresso((atual) => Math.max(atual ?? 0, p.percentual ?? 0))
            continue
          }
          if (p.erro) throw new ErroApi(p.erro)
          break
        }
        substituirMes(mes, (await campanha.listar()).filter((c) => c.mes === mes))
        terminouSemErro = true
      } catch (e) {
        setErro(mensagemErro(e))
      } finally {
        setOcupado(null)
        setProgresso(null)
      }
      if (terminouSemErro) await sincronizar(mes)
    },
    [campanha, substituirMes, sincronizar],
  )

  return { clientes, carregando, ocupado, progresso, erro, tentarNovamente: carregar, montar, sincronizar }
}

const WELLPET: ApiCampanha<ClienteCampanhaWellpet> = {
  listar: api.listarCampanhaWellpet,
  montar: api.montarCampanhaWellpet,
  sincronizar: api.sincronizarCampanhaWellpet,
  progresso: api.progressoCampanhaWellpet,
}

const ORGANNACT: ApiCampanha<ClienteCampanhaOrgannact> = {
  listar: api.listarCampanhaOrgannact,
  montar: api.montarCampanhaOrgannact,
  sincronizar: api.sincronizarCampanhaOrgannact,
  progresso: api.progressoCampanhaOrgannact,
}

/** Campanha Wellpet: quem da carteira nunca comprou Wellpet. */
export function useCampanhaWellpet() {
  return useCampanhaPositivacao(WELLPET)
}

/** Campanha Organnact: toda a carteira de quem tem meta Organnact, com a positivação por semana. */
export function useCampanhaOrgannact() {
  return useCampanhaPositivacao(ORGANNACT)
}
