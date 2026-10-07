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
   * Busca na ADS quem da lista comprou Wellpet no mês (leva menos de um minuto), perguntando a cada
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
          const { percentual } = await api.progressoCampanhaWellpet(mes)
          // Resposta que chega depois de terminar não traz a barra de volta.
          if (percentual !== null && emAndamento) setProgresso((atual) => Math.max(atual ?? 0, percentual))
        } catch {
          // ignora
        }
      }, 1000)
      try {
        substituirMes(mes, await api.sincronizarCampanhaWellpet(mes))
      } catch (e) {
        setErro(mensagemErro(e))
      } finally {
        emAndamento = false
        clearInterval(acompanhar)
        setOcupado(null)
        setProgresso(null)
      }
    },
    [substituirMes],
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
        await api.montarCampanhaWellpet(mes)
        for (;;) {
          await new Promise((ok) => setTimeout(ok, 2000))
          let p: api.ProgressoCampanhaWellpet
          try {
            p = await api.progressoCampanhaWellpet(mes)
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
        substituirMes(mes, (await api.listarCampanhaWellpet()).filter((c) => c.mes === mes))
        terminouSemErro = true
      } catch (e) {
        setErro(mensagemErro(e))
      } finally {
        setOcupado(null)
        setProgresso(null)
      }
      if (terminouSemErro) await sincronizar(mes)
    },
    [substituirMes, sincronizar],
  )

  return { clientes, carregando, ocupado, progresso, erro, tentarNovamente: carregar, montar, sincronizar }
}
