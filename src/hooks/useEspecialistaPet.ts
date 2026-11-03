import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi } from '../lib/api'
import type { LinhaPlanilhaEspecialistaPet } from '../lib/api'
import type { ClienteEspecialistaPet } from '../types'

function mensagemErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.'
}

/** Clientes da campanha Especialista Pet, de todos os meses, com importação da planilha e sincronização com a ADS. */
export function useEspecialistaPet() {
  const [clientes, setClientes] = useState<ClienteEspecialistaPet[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState<'importando' | 'sincronizando' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  /** 0 a 100 enquanto sincroniza com a ADS; null fora disso. */
  const [progresso, setProgresso] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setClientes(await api.listarEspecialistaPet())
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
  const substituirMes = useCallback((mes: string, doMes: ClienteEspecialistaPet[]) => {
    setClientes((atual) => [...atual.filter((c) => c.mes !== mes), ...doMes])
  }, [])

  const sincronizar = useCallback(
    async (mes: string) => {
      setErro(null)
      setOcupado('sincronizando')
      setProgresso(0)
      // A sincronização demora (busca o mês inteiro na ADS, página a página): enquanto ela não volta,
      // pergunta a cada segundo quanto já foi. Falha aqui não importa, só deixa a barra parada.
      let emAndamento = true
      const acompanhar = setInterval(async () => {
        try {
          const p = await api.progressoSincronizacaoEspecialistaPet(mes)
          // Resposta que chega depois de terminar não traz a barra de volta.
          if (p !== null && emAndamento) setProgresso((atual) => Math.max(atual ?? 0, p))
        } catch {
          // ignora
        }
      }, 1000)
      try {
        substituirMes(mes, await api.sincronizarEspecialistaPet(mes))
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

  /** Grava a planilha do mês e já busca o realizado na ADS. */
  const importar = useCallback(
    async (mes: string, linhas: LinhaPlanilhaEspecialistaPet[]) => {
      setErro(null)
      setOcupado('importando')
      try {
        substituirMes(mes, await api.importarEspecialistaPet(mes, linhas))
      } catch (e) {
        setErro(mensagemErro(e))
        setOcupado(null)
        return
      }
      await sincronizar(mes)
    },
    [substituirMes, sincronizar],
  )

  /** Lança (ou remove, com null) o kg ajustado à mão de um cliente. */
  const ajustar = useCallback(async (id: string, realizadoTotal: number | null) => {
    setErro(null)
    try {
      const salvo = await api.ajustarEspecialistaPet(id, realizadoTotal)
      setClientes((atual) => atual.map((c) => (c.id === id ? salvo : c)))
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }, [])

  return { clientes, carregando, ocupado, progresso, erro, setErro, tentarNovamente: carregar, importar, sincronizar, ajustar }
}
