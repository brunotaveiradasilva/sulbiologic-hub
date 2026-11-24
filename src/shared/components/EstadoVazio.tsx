import type { ReactNode } from 'react'

interface Props {
  titulo: string
  texto: string
  children?: ReactNode
}

export function EstadoVazio({ titulo, texto, children }: Props) {
  return (
    <div className="empty">
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {children}
    </div>
  )
}
