const TAMANHO = 128

/** Lê um arquivo de imagem, recorta um quadrado central e redimensiona pra um avatar pequeno em JPEG. */
export function redimensionarAvatar(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()

    leitor.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = TAMANHO
        canvas.height = TAMANHO
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'))
          return
        }

        const lado = Math.min(img.width, img.height)
        const sx = (img.width - lado) / 2
        const sy = (img.height - lado) / 2
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, TAMANHO, TAMANHO)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
      img.src = leitor.result as string
    }
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    leitor.readAsDataURL(arquivo)
  })
}
