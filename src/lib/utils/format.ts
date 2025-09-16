/**
 * 문자열 포맷 관련 유틸리티 함수들
 */

/**
 * 문자열에서 숫자만 추출
 * @param value - 입력 문자열
 * @returns 숫자만 포함된 문자열
 */
export function extractNumbers(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/[^\d]/g, '')
}

/**
 * 전화번호 포맷 (표시용)
 * @param phone - 전화번호 (숫자만)
 * @returns 하이픈이 포함된 전화번호
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  const numbers = extractNumbers(phone)
  
  // 휴대폰 번호 (010, 011 등)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  // 일반 전화 (02 서울)
  if (numbers.length === 10 && numbers.startsWith('02')) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  // 일반 전화 (031 경기 등)
  if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  // 기타 (변환 불가)
  return numbers
}

/**
 * 계좌번호 포맷 (표시용)
 * @param accountNumber - 계좌번호 (숫자만)
 * @param bankName - 은행명 (선택사항, 포맷 힌트용)
 * @returns 하이픈이 포함된 계좌번호
 */
export function formatAccountNumber(accountNumber: string | null | undefined, bankName?: string): string {
  if (!accountNumber) return ''
  const numbers = extractNumbers(accountNumber)
  
  // 일반적인 계좌번호 포맷 (예: 123456-78-901234)
  // 은행별로 다를 수 있지만 기본 포맷 적용
  if (numbers.length >= 11 && numbers.length <= 14) {
    // 6-2-나머지 포맷
    return `${numbers.slice(0, 6)}-${numbers.slice(6, 8)}-${numbers.slice(8)}`
  }
  
  return numbers
}

/**
 * 사업자등록번호 포맷 (표시용)
 * @param businessNumber - 사업자등록번호 (숫자만)
 * @returns 하이픈이 포함된 사업자등록번호 (123-45-67890)
 */
export function formatBusinessNumber(businessNumber: string | null | undefined): string {
  if (!businessNumber) return ''
  const numbers = extractNumbers(businessNumber)
  
  if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
  }
  
  return numbers
}

/**
 * 숫자를 한국어 로케일 형식으로 포맷
 * @param value - 숫자 또는 숫자로 변환 가능한 값
 * @param fallback - 포맷할 수 없을 때 반환할 기본 문자열
 */
export function formatNumber(value: number | string | null | undefined, fallback = '0'): string {
  if (value === null || value === undefined) return fallback

  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return fallback

  return new Intl.NumberFormat('ko-KR').format(num)
}

/**
 * 통화 포맷 (표시용)
 * @param amount - 금액 (숫자 또는 문자열)
 * @returns 콤마가 포함된 원화 문자열 (예: "1,000원")
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const formatted = formatNumber(amount, '0')
  return `${formatted}원`
}
