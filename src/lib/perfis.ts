import type { Role } from '../types'

/** Perfis de login na ordem em que aparecem no formulário, com o que cada um pode fazer. */
export const PERFIS: { valor: Role; rotulo: string; descricao: string }[] = [
  { valor: 'REPRESENTANTE', rotulo: 'Representante', descricao: 'Consulta só as próprias metas e campanhas.' },
  { valor: 'SUPERVISOR', rotulo: 'Supervisor', descricao: 'Consulta as metas e campanhas de todos os representantes.' },
  { valor: 'ADMIN', rotulo: 'Administrador', descricao: 'Gerencia tudo, inclusive os usuários.' },
  { valor: 'USUARIO', rotulo: 'Almoxarifado', descricao: 'Só materiais e agendamentos.' },
]
