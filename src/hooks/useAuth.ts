import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi, aoSessaoExpirar } from '../lib/api'
import { limparSessao, salvarAvatar, salvarSessao, sessaoSalva } from '../lib/auth'
import type { Role } from '../types'

/** Sessão do usuário: quem está logado (se alguém), seu papel, foto, e as ações de entrar/sair/trocar foto. */
export function useAuth() {
  const [usuario, setUsuario] = useState<string | null>(() => sessaoSalva()?.usuario ?? null)
  const [role, setRole] = useState<Role | null>(() => sessaoSalva()?.role ?? null)
  const [avatar, setAvatar] = useState<string | null>(() => sessaoSalva()?.avatar ?? null)
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const sair = useCallback(() => {
    limparSessao()
    setUsuario(null)
    setRole(null)
    setAvatar(null)
  }, [])

  // Se qualquer chamada à API devolver 401 (token expirado, por exemplo), volta pra tela de login.
  useEffect(() => {
    aoSessaoExpirar(sair)
    return () => aoSessaoExpirar(null)
  }, [sair])

  const entrar = useCallback(async (usuarioDigitado: string, senha: string) => {
    setEntrando(true)
    setErro(null)
    try {
      const resposta = await api.login(usuarioDigitado, senha)
      salvarSessao(resposta.token, resposta.usuario, resposta.role, resposta.avatar ?? null)
      setUsuario(resposta.usuario)
      setRole(resposta.role)
      setAvatar(resposta.avatar ?? null)
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível entrar. Tente de novo.')
    } finally {
      setEntrando(false)
    }
  }, [])

  const trocarFoto = useCallback(async (novoAvatar: string | null) => {
    await api.atualizarAvatar(novoAvatar)
    salvarAvatar(novoAvatar)
    setAvatar(novoAvatar)
  }, [])

  return {
    usuario,
    role,
    avatar,
    isAdmin: role === 'ADMIN',
    /** Enxerga Metas e Campanhas (supervisor e representante só consultam). */
    consultaMetas: role === 'ADMIN' || role === 'SUPERVISOR' || role === 'REPRESENTANTE',
    logado: usuario !== null,
    entrando,
    erro,
    entrar,
    sair,
    trocarFoto,
  }
}
