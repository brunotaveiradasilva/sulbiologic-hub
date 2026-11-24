/**
 * Id provisório usado só entre o clique de salvar e a resposta da API — a lista já
 * atualiza na hora, e esse id é trocado pelo definitivo (gerado pelo banco) quando a
 * criação é confirmada. Prefixo evita qualquer colisão com ids reais (UUID).
 */
export function idTemporario(): string {
  return 'tmp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
