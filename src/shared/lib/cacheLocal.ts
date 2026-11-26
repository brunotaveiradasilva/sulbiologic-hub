import { sessaoSalva } from '../../features/auth/auth'

/**
 * Cópia local do último retorno da API, por usuário, pra tela abrir na hora com o que já se viu
 * enquanto a API (Render Free, que dorme) acorda. Quem usa mostra os dados do cache e troca pelos
 * do servidor assim que chegarem. Some no logout (limparCachesLocais), já que o celular pode ser
 * compartilhado.
 */
const PREFIXO = 'sulbiologic-cache:'
// Subir quando o formato dos dados mudar, pra não abrir a tela com dados no formato antigo.
const VERSAO = 1

interface Guardado<T> {
  versao: number
  salvoEm: string
  dados: T
}

function chave(nome: string): string | null {
  const sessao = sessaoSalva()
  return sessao ? `${PREFIXO}${sessao.usuario}:${nome}` : null
}

/** O que foi guardado para o usuário logado, com a hora em que foi salvo; null se não houver. */
export function lerCache<T>(nome: string): { dados: T; salvoEm: Date } | null {
  const k = chave(nome)
  if (!k) return null
  try {
    const bruto = localStorage.getItem(k)
    if (!bruto) return null
    const guardado = JSON.parse(bruto) as Guardado<T>
    if (guardado.versao !== VERSAO) return null
    return { dados: guardado.dados, salvoEm: new Date(guardado.salvoEm) }
  } catch {
    return null
  }
}

export function gravarCache<T>(nome: string, dados: T): void {
  const k = chave(nome)
  if (!k) return
  try {
    const guardado: Guardado<T> = { versao: VERSAO, salvoEm: new Date().toISOString(), dados }
    localStorage.setItem(k, JSON.stringify(guardado))
  } catch {
    // Sem espaço ou sem localStorage: só fica sem cache, a tela continua funcionando.
  }
}

/** Apaga os caches de todos os usuários deste navegador (chamado no logout). */
export function limparCachesLocais(): void {
  try {
    const chaves: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIXO)) chaves.push(k)
    }
    chaves.forEach((k) => localStorage.removeItem(k))
  } catch {
    // nada a fazer
  }
}
