/**
 * Linha discreta avisando que a tela mostra a cópia salva neste aparelho (ver cacheLocal), e não os
 * dados mais novos da API. Some quando a API responde; se a API falhar, continua aparecendo junto do erro.
 */
interface Props {
  salvoEm: Date | null
  atualizando: boolean
}

function quando(data: Date): string {
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const hoje = new Date()
  if (data.toDateString() === hoje.toDateString()) return `hoje às ${hora}`
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${dia} às ${hora}`
}

export function AvisoDadosSalvos({ salvoEm, atualizando }: Props) {
  if (!salvoEm) return null
  return (
    <p className="hint aviso-dados-salvos" role="status">
      Dados de {quando(salvoEm)}
      {atualizando ? ' · atualizando…' : ' · não foi possível atualizar agora'}
    </p>
  )
}
