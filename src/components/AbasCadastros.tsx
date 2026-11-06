import { subabasCadastros, type SubabaCadastros } from '../lib/navegacao'

interface Props {
  subaba: SubabaCadastros
  aoMudarSubaba: (subaba: SubabaCadastros) => void
  isAdmin: boolean
  veAlmoxarifado: boolean
}

/** Abas entre os cadastros. No computador a navegação fica no menu lateral; estas só aparecem no celular. */
export function AbasCadastros({ subaba, aoMudarSubaba, isAdmin, veAlmoxarifado }: Props) {
  return (
    <nav className="tabs tabs-so-celular" role="tablist">
      {subabasCadastros(isAdmin, veAlmoxarifado).map((s) => (
        <button key={s.valor} role="tab" aria-selected={subaba === s.valor} onClick={() => aoMudarSubaba(s.valor)}>
          {s.rotulo}
        </button>
      ))}
    </nav>
  )
}
