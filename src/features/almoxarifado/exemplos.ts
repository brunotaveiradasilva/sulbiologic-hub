import { somarDias } from '../../shared/lib/datas'
import type { Agendamento, Material, Status } from '../../types'

export type ExemploMaterial = Omit<Material, 'id'>

/** Um agendamento de exemplo, referenciando o material pela posição no array (o id real só existe depois de criado na API). */
export type ExemploAgendamento = Omit<Agendamento, 'id' | 'materialId'> & { materialIndex: number }

/** Dados fictícios para conhecer o app sem precisar cadastrar nada. */
export function criarExemplos(): { materiais: ExemploMaterial[]; agendamentos: ExemploAgendamento[] } {
  const materiais: ExemploMaterial[] = [
    { nome: 'Furadeira de impacto', codigo: 'FER-014', estoque: 3, obs: 'Maleta com brocas no armário 2.' },
    { nome: 'Projetor multimídia', codigo: 'AUD-002', estoque: 2, obs: 'Acompanha cabo HDMI e controle.' },
    { nome: 'Escada de alumínio 6 degraus', codigo: 'EST-007', estoque: 4, obs: '' },
  ]
  // materialIndex abaixo se refere à posição em `materiais`: 0 = furadeira, 1 = projetor, 2 = escada
  const agendamentos: ExemploAgendamento[] = [
    {
      materialIndex: 1,
      qtd: 1,
      responsavel: 'Marina Alves',
      cliente: 'Colégio Santa Cruz',
      retirada: somarDias(-6),
      devolucao: somarDias(-2),
      status: 'retirado' as Status,
      obs: 'Treinamento na sala 3.',
    },
    {
      materialIndex: 0,
      qtd: 1,
      responsavel: 'Carlos Prado',
      cliente: 'Construtora Vale Verde',
      retirada: somarDias(0),
      devolucao: somarDias(2),
      status: 'agendado' as Status,
      obs: 'Instalação das prateleiras.',
    },
    {
      materialIndex: 2,
      qtd: 2,
      responsavel: 'Equipe de manutenção',
      cliente: '',
      retirada: somarDias(1),
      devolucao: somarDias(4),
      status: 'agendado' as Status,
      obs: 'Uso interno.',
    },
    {
      materialIndex: 1,
      qtd: 1,
      responsavel: 'Júlia Ferraz',
      cliente: 'Colégio Santa Cruz',
      retirada: somarDias(-12),
      devolucao: somarDias(-9),
      status: 'devolvido' as Status,
      obs: 'Devolvido sem o controle; reposto depois.',
    },
  ]

  return { materiais, agendamentos }
}
