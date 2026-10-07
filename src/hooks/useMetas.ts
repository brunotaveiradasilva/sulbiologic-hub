import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi } from '../lib/api'
import type { MetaEntrada, MetaRepresentanteEntrada, RepresentanteEntrada } from '../lib/api'
import { idTemporario } from '../lib/idTemporario'
import type { Fornecedor, Meta, MetaRepresentante, Representante, TotalVendidoMensal } from '../types'

function mensagemErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.'
}

/** Troca as que já estão na lista (mesmo id) e acrescenta as novas no fim. */
function mesclarPorId(atual: MetaRepresentante[], vindas: MetaRepresentante[]): MetaRepresentante[] {
  const porId = new Map(vindas.map((m) => [m.id, m]))
  const trocadas = atual.map((m) => porId.get(m.id) ?? m)
  const ids = new Set(atual.map((m) => m.id))
  return [...trocadas, ...vindas.filter((m) => !ids.has(m.id))]
}

/**
 * Estado dos cadastros de apoio às metas — fornecedores, representantes e metas —, só para quem é
 * admin. Mesmo padrão otimista do useAlmoxarifado: atualiza a tela na hora e confirma com a API
 * depois; se a API recusar, desfaz e mostra o erro.
 */
export function useMetas() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [metasRepresentante, setMetasRepresentante] = useState<MetaRepresentante[]>([])
  const [totaisVendidos, setTotaisVendidos] = useState<TotalVendidoMensal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarTudo = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [
        fornecedoresCarregados,
        representantesCarregados,
        metasCarregadas,
        metasRepresentanteCarregadas,
        totaisCarregados,
      ] = await Promise.all([
        api.listarFornecedores(),
        api.listarRepresentantes(),
        api.listarMetas(),
        api.listarMetasRepresentante(),
        api.listarTotaisVendidos(),
      ])
      setFornecedores(fornecedoresCarregados)
      setRepresentantes(representantesCarregados)
      setMetas(metasCarregadas)
      setMetasRepresentante(metasRepresentanteCarregadas)
      setTotaisVendidos(totaisCarregados)
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarTudo()
  }, [carregarTudo])

  const salvarFornecedor = useCallback(
    (fornecedor: Omit<Fornecedor, 'id'>, id?: string | null) => {
      setErro(null)

      if (id) {
        const anterior = fornecedores
        setFornecedores((atual) => atual.map((f) => (f.id === id ? { ...f, ...fornecedor } : f)))
        api
          .atualizarFornecedor(id, fornecedor)
          .then((atualizado) => setFornecedores((atual) => atual.map((f) => (f.id === id ? atualizado : f))))
          .catch((e) => {
            setErro(mensagemErro(e))
            setFornecedores(anterior)
          })
        return
      }

      const provisorio = idTemporario()
      setFornecedores((atual) => [...atual, { ...fornecedor, id: provisorio }])
      api
        .criarFornecedor(fornecedor)
        .then((criado) => setFornecedores((atual) => atual.map((f) => (f.id === provisorio ? criado : f))))
        .catch((e) => {
          setErro(mensagemErro(e))
          setFornecedores((atual) => atual.filter((f) => f.id !== provisorio))
        })
    },
    [fornecedores],
  )

  const removerFornecedor = useCallback(
    (id: string) => {
      setErro(null)
      const anterior = fornecedores
      setFornecedores((atual) => atual.filter((f) => f.id !== id))
      api.excluirFornecedor(id).catch((e) => {
        setErro(mensagemErro(e))
        setFornecedores(anterior)
      })
    },
    [fornecedores],
  )

  const salvarRepresentante = useCallback(
    (representante: RepresentanteEntrada, id?: string | null) => {
      setErro(null)

      if (id) {
        // Otimista só com o que dá pra saber na hora (nome, email, celular); os fornecedores
        // completos (nome incluso) só voltam certos na resposta da API.
        setRepresentantes((atual) => atual.map((v) => (v.id === id ? { ...v, ...representante } : v)))
        api
          .atualizarRepresentante(id, representante)
          .then((atualizado) => setRepresentantes((atual) => atual.map((v) => (v.id === id ? atualizado : v))))
          .catch((e) => {
            setErro(mensagemErro(e))
            carregarTudo()
          })
        return
      }

      api
        .criarRepresentante(representante)
        .then((criado) => setRepresentantes((atual) => [...atual, criado]))
        .catch((e) => setErro(mensagemErro(e)))
    },
    [carregarTudo],
  )

  const removerRepresentante = useCallback(
    (id: string) => {
      setErro(null)
      const anterior = representantes
      setRepresentantes((atual) => atual.filter((v) => v.id !== id))
      api.excluirRepresentante(id).catch((e) => {
        setErro(mensagemErro(e))
        setRepresentantes(anterior)
      })
    },
    [representantes],
  )

  const salvarMeta = useCallback(
    (meta: MetaEntrada, id?: string | null) => {
      setErro(null)

      if (id) {
        api
          .atualizarMeta(id, meta)
          .then((atualizada) => setMetas((atual) => atual.map((m) => (m.id === id ? atualizada : m))))
          .catch((e) => setErro(mensagemErro(e)))
        return
      }

      api
        .criarMeta(meta)
        .then((criada) => setMetas((atual) => [...atual, criada]))
        .catch((e) => setErro(mensagemErro(e)))
    },
    [],
  )

  const removerMeta = useCallback((id: string) => {
    setErro(null)
    const anterior = metas
    setMetas((atual) => atual.filter((m) => m.id !== id))
    api.excluirMeta(id).catch((e) => {
      setErro(mensagemErro(e))
      setMetas(anterior)
    })
  }, [metas])

  const ocultarMeta = useCallback((id: string, oculta: boolean) => {
    setErro(null)
    const anterior = metas
    setMetas((atual) => atual.map((m) => (m.id === id ? { ...m, oculta } : m)))
    api
      .ocultarMeta(id, oculta)
      .then((atualizada) => setMetas((atual) => atual.map((m) => (m.id === id ? atualizada : m))))
      .catch((e) => {
        setErro(mensagemErro(e))
        setMetas(anterior)
      })
  }, [metas])

  /**
   * Troca duas metas de lugar na ordem e grava a ordem nova na API. Recebe a vizinha em vez de uma
   * direção porque cada tela mostra uma parte da lista (ex: só os fornecedores do representante) —
   * quem a pessoa vê em cima ou embaixo nem sempre é a vizinha na lista inteira.
   */
  const trocarOrdemMetas = useCallback(
    (id: string, outroId: string) => {
      const i = metas.findIndex((m) => m.id === id)
      const j = metas.findIndex((m) => m.id === outroId)
      if (i < 0 || j < 0 || i === j) return

      setErro(null)
      const anterior = metas
      const reordenadas = [...metas]
      ;[reordenadas[i], reordenadas[j]] = [reordenadas[j], reordenadas[i]]
      setMetas(reordenadas)
      api
        .ordenarMetas(reordenadas.map((m) => m.id))
        .then(setMetas)
        .catch((e) => {
          setErro(mensagemErro(e))
          setMetas(anterior)
        })
    },
    [metas],
  )

  /** Cria (id null/undefined) ou atualiza (id preenchido) o valor de meta de um representante. */
  const salvarMetaRepresentante = useCallback(
    (mv: MetaRepresentanteEntrada, id?: string | null): Promise<MetaRepresentante> => {
      setErro(null)

      const promessa = id ? api.atualizarMetaRepresentante(id, mv) : api.criarMetaRepresentante(mv)
      return promessa
        .then((salva) => {
          setMetasRepresentante((atual) => {
            const existe = atual.some((m) => m.id === salva.id)
            return existe ? atual.map((m) => (m.id === salva.id ? salva : m)) : [...atual, salva]
          })
          return salva
        })
        .catch((e) => {
          setErro(mensagemErro(e))
          throw e
        })
    },
    [],
  )

  const removerMetaRepresentante = useCallback((id: string) => {
    setErro(null)
    const anterior = metasRepresentante
    setMetasRepresentante((atual) => atual.filter((m) => m.id !== id))
    api.excluirMetaRepresentante(id).catch((e) => {
      setErro(mensagemErro(e))
      setMetasRepresentante(anterior)
    })
  }, [metasRepresentante])

  const [sincronizando, setSincronizando] = useState(false)

  /**
   * Força agora o recálculo do realizado de um mês a partir do histórico de vendas da ADS. A API só
   * devolve as atribuições que realmente têm representante e meta com código ADS cadastrado — as
   * outras continuam como estavam, só mescla as que vieram atualizadas. O total vendido do mês é
   * recalculado junto, então recarrega os totais — senão o card "Total vendido" fica com o valor antigo.
   */
  const sincronizarComAds = useCallback(async (mes: string) => {
    setErro(null)
    setSincronizando(true)
    try {
      // A sincronização também cria linhas novas (valor 0, "sem meta") pra guardar o realizado de quem não tem meta.
      const atualizadas = await api.sincronizarMetasRepresentante(mes)
      setMetasRepresentante((atual) => mesclarPorId(atual, atualizadas))
      setTotaisVendidos(await api.listarTotaisVendidos())
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setSincronizando(false)
    }
  }, [])

  /**
   * Copia os valores de meta do mês `de` pro `para` (só o que falta no destino — a linha "sem meta" conta como
   * falta e é preenchida). Devolve quantas foram copiadas; erro sobe pra quem chamou.
   */
  const copiarMetasDoMes = useCallback(async (de: string, para: string, fornecedorId?: string): Promise<number> => {
    setErro(null)
    const criadas = await api.copiarMetasRepresentante(de, para, fornecedorId)
    setMetasRepresentante((atual) => mesclarPorId(atual, criadas))
    return criadas.length
  }, [])

  return {
    fornecedores,
    representantes,
    metas,
    metasRepresentante,
    totaisVendidos,
    carregando,
    erro,
    tentarNovamente: carregarTudo,
    salvarFornecedor,
    removerFornecedor,
    salvarRepresentante,
    removerRepresentante,
    salvarMeta,
    removerMeta,
    ocultarMeta,
    trocarOrdemMetas,
    salvarMetaRepresentante,
    removerMetaRepresentante,
    sincronizarComAds,
    sincronizando,
    copiarMetasDoMes,
  }
}
