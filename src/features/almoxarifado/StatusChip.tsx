import { ROTULO_STATUS } from './regras'
import type { StatusExibido } from '../../types'

export function StatusChip({ status }: { status: StatusExibido }) {
  return <span className={`chip ${status}`}>{ROTULO_STATUS[status]}</span>
}
