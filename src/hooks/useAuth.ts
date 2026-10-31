import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { ErroApi, aoSessaoExpirar } from '../lib/api'
import { limparSessao, salvarAvatar, salvarPerfil, salvarSessao, sessaoSalva } from '../lib/auth'
import type { MeusDados, Role } from '../types'

/** Sessão do usuário: quem está logado (se alguém), seu papel, foto, e as ações de entrar/sair/trocar foto. */
export function useAuth() {
  const [usuario, setUsuario] = useState<string | null>(() => sessaoSalva()?.usuario ?? null)
  const [role, setRole] = useState<Role | null>(() => sessaoSalva()?.role ?? null)
  const [avatar, setAvatar] = useState<string | null>(() => sessaoSalva()?.avatar ?? null)
  const [nome, setNome] = useState<string | null>(() => sessaoSalva()?.nome ?? null)
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const sair = useCallback(() => {
    limparSessao()
    setUsuario(null)
    setRole(null)
    setAvatar(null)
    setNome(null)
  }, [])

  // Se qualquer chamada à API devolver 401 (token expirado, por exemplo), volta pra tela de login.
  useEffect(() => {
    aoSessaoExpirar(sair)
    return () => aoSessaoExpirar(null)
  }, [sair])

  // Com sessão salva, confere na API o nome, a foto e o perfil atuais: o admin pode ter mudado algo
  // desde o login (e sessões de antes do nome existir passam a ter o nome sem entrar de novo).
  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    api
      .eu()
      .then((atual) => {
        if (cancelado) return
        salvarPerfil(atual.role, atual.avatar ?? null, atual.nome ?? null)
        setRole(atual.role)
        setAvatar(atual.avatar ?? null)
        setNome(atual.nome ?? null)
      })
      .catch(() => {
        // Sem conexão ou API antiga: segue com o que está salvo (401 já derruba a sessão em requisitar).
      })
    return () => {
      cancelado = true
    }
  }, [usuario])

  const entrar = useCallback(async (usuarioDigitado: string, senha: string) => {
    setEntrando(true)
    setErro(null)
    try {
      const resposta = await api.login(usuarioDigitado, senha)
      salvarSessao(resposta.token, resposta.usuario, resposta.role, resposta.avatar ?? null, resposta.nome ?? null)
      setUsuario(resposta.usuario)
      setRole(resposta.role)
      setAvatar(resposta.avatar ?? null)
      setNome(resposta.nome ?? null)
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

  /** Minha conta: salva nome e contato e já atualiza a saudação e o menu. */
  const atualizarMeusDados = useCallback(async (dados: MeusDados) => {
    const atual = await api.atualizarMeusDados(dados)
    salvarPerfil(atual.role, atual.avatar ?? null, atual.nome ?? null)
    setNome(atual.nome ?? null)
    return atual
  }, [])

  return {
    usuario,
    role,
    avatar,
    /** Como chamar a pessoa na tela: o nome cadastrado, ou o login se não tiver nome. */
    nomeExibido: nome || usuario,
    isAdmin: role === 'ADMIN',
    /** O supervisor também dispara a sincronização da Especialista Pet com a ADS (importar segue só do admin). */
    sincronizaEspecialistaPet: role === 'ADMIN' || role === 'SUPERVISOR',
    /** Enxerga Metas e Campanhas (supervisor e representante só consultam). */
    consultaMetas: role === 'ADMIN' || role === 'SUPERVISOR' || role === 'REPRESENTANTE',
    /** Materiais e agendamentos: todo mundo menos o representante, que só vê as metas e campanhas dele. */
    veAlmoxarifado: role !== 'REPRESENTANTE',
    logado: usuario !== null,
    entrando,
    erro,
    entrar,
    sair,
    trocarFoto,
    atualizarMeusDados,
  }
}
