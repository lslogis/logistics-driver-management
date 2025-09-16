// Fixed Route Types and Validations

export const CONTRACT_TYPES = [
  { value: 'CONSIGNED_MONTHLY', label: '위탁월계', description: '매월 위탁 형태로 진행되는 계약' },
  { value: 'FIXED_DAILY', label: '고정일계', description: '고정 일일 요금제 계약' },
  { value: 'FIXED_MONTHLY', label: '고정월계', description: '고정 월간 요금제 계약' }
] as const

export type ContractType = 'CONSIGNED_MONTHLY' | 'FIXED_DAILY' | 'FIXED_MONTHLY'

export function getContractTypeColor(type: ContractType): string {
  switch (type) {
    case 'CONSIGNED_MONTHLY':
      return 'blue'
    case 'FIXED_DAILY':
      return 'green'
    case 'FIXED_MONTHLY':
      return 'purple'
    default:
      return 'gray'
  }
}