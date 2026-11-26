// Nome do hub em minúsculas, como o "retira" do Retira: "sulbiologic" forte e " hub" em cinza.
// O ícone com o "S" fica só na aba do navegador (public/icone.svg).

interface LogoProps {
  /** Tamanho da letra em pixels. */
  size?: number
}

export function Logo({ size = 17 }: LogoProps) {
  return (
    <span className="logo">
      <span className="logo-nome" style={{ fontSize: size }} aria-hidden="true">
        sulbiologic<span className="logo-nome-hub"> hub</span>
      </span>
      <span className="sr-only">SulBiologic Hub</span>
    </span>
  )
}
