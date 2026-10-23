import type { LoginGerado } from '../types'

/** Endereço do app como o representante vai abrir (mesma origem e caminho base do GitHub Pages). */
export function enderecoDoApp(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

/** Texto pronto pra colar no WhatsApp ou no e-mail do representante. */
export function mensagemDeAcesso(login: LoginGerado): string {
  const nome = login.nome?.trim()
  return [
    nome ? `Olá, ${nome}!` : 'Olá!',
    'Seu acesso ao SulBiologic Hub, pra acompanhar suas metas e campanhas:',
    '',
    enderecoDoApp(),
    `Usuário: ${login.usuario}`,
    `Senha: ${login.senha}`,
    '',
    'Depois de entrar, dá pra trocar a senha em Minha conta.',
  ].join('\n')
}

/**
 * Link do WhatsApp já com a mensagem, ou null sem celular. Número com 10 ou 11 dígitos (DDD + número)
 * ganha o 55 do Brasil na frente.
 */
export function linkWhatsApp(login: LoginGerado): string | null {
  const digitos = (login.celular ?? '').replace(/\D/g, '')
  if (digitos.length < 10) return null
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagemDeAcesso(login))}`
}

/** Copia pra área de transferência; false se o navegador não deixou. */
export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
