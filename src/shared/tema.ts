// Tema escolhido pela pessoa: segue o do aparelho ("sistema") ou fica fixo em claro/escuro.
// O CSS já tem as duas paletas; aqui só se liga o atributo data-theme no <html> e se guarda a escolha.
// O index.html repete essa leitura num script curto antes de a página desenhar, pra não piscar claro.

export type Tema = 'sistema' | 'claro' | 'escuro'

const CHAVE = 'sulbiologic-hub:tema'

/** Cor da barra do sistema (Android/iOS) em cada tema: a mesma do fundo da tela. */
const COR_BARRA = { claro: '#FFFFFF', escuro: '#0A0A0A' } as const

export function lerTema(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement
  if (tema === 'sistema') delete raiz.dataset.theme
  else raiz.dataset.theme = tema === 'escuro' ? 'dark' : 'light'

  // As duas <meta name="theme-color"> têm media (claro/escuro do aparelho). Com tema fixo, as duas
  // passam a usar a cor dele; em "sistema", cada uma volta pra cor do seu media.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const doEscuro = meta.media.includes('dark')
    meta.content = tema === 'sistema' ? COR_BARRA[doEscuro ? 'escuro' : 'claro'] : COR_BARRA[tema]
  })
}

export function salvarTema(tema: Tema) {
  try {
    if (tema === 'sistema') localStorage.removeItem(CHAVE)
    else localStorage.setItem(CHAVE, tema)
  } catch {
    // Sem localStorage (aba anônima bloqueada): o tema vale só até recarregar.
  }
  aplicarTema(tema)
}
