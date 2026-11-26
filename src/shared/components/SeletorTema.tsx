import { useState } from 'react'
import { lerTema, salvarTema, type Tema } from '../tema'

const OPCOES: { valor: Tema; rotulo: string }[] = [
  { valor: 'sistema', rotulo: 'Sistema' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
]

/** Três opções lado a lado no menu da conta: seguir o aparelho, claro ou escuro. Vale na hora e fica salvo. */
export function SeletorTema() {
  const [tema, setTema] = useState<Tema>(lerTema)

  return (
    <div className="tema-seletor">
      <span className="tema-seletor-rotulo" id="tema-seletor-rotulo">Tema</span>
      <div className="tema-seletor-opcoes" role="radiogroup" aria-labelledby="tema-seletor-rotulo">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={tema === opcao.valor}
            onClick={() => {
              setTema(opcao.valor)
              salvarTema(opcao.valor)
            }}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}
