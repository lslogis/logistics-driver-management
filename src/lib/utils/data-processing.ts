/**
 * 데이터 처리 유틸리티
 * - 연락처, 계좌번호 특수문자 제거 및 포맷팅
 * - Excel 내보내기 시 텍스트 형식 처리
 */

/**
 * 연락처에서 특수문자 제거 (DB 저장용)
 * @param phone - 입력된 연락처
 * @returns 숫자만 포함된 연락처 (예: "01012345678")
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/[^\d]/g, '')
}

/**
 * 연락처를 표시용 형식으로 포맷팅
 * @param phone - DB에 저장된 연락처 (숫자만)
 * @returns 하이픈 포함 연락처 (예: "010-1234-5678")
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return ''
  const sanitized = phone.replace(/[^\d]/g, '')
  
  if (sanitized.length === 11 && sanitized.startsWith('010')) {
    return `${sanitized.slice(0, 3)}-${sanitized.slice(3, 7)}-${sanitized.slice(7)}`
  }
  
  // 다른 패턴의 번호도 처리 (예: 지역번호)
  if (sanitized.length === 10) {
    return `${sanitized.slice(0, 3)}-${sanitized.slice(3, 6)}-${sanitized.slice(6)}`
  }
  
  return phone // 패턴이 맞지 않으면 원본 반환
}

/**
 * 계좌번호에서 특수문자 제거 (DB 저장용)
 * @param accountNumber - 입력된 계좌번호
 * @returns 숫자만 포함된 계좌번호
 */
export function sanitizeAccountNumber(accountNumber: string): string {
  if (!accountNumber) return ''
  return accountNumber.replace(/[^\d]/g, '')
}

/**
 * 계좌번호를 표시용 형식으로 포맷팅 (은행별 패턴 적용)
 * @param accountNumber - DB에 저장된 계좌번호 (숫자만)
 * @param bankName - 은행명 (선택사항, 은행별 포맷팅 적용)
 * @returns 하이픈 포함 계좌번호
 */
export function formatAccountNumberForDisplay(
  accountNumber: string, 
  bankName?: string
): string {
  if (!accountNumber) return ''
  const sanitized = accountNumber.replace(/[^\d]/g, '')
  
  // 기본 포맷팅 (6-2-6 또는 3-6-6 패턴)
  if (sanitized.length >= 10) {
    if (sanitized.length <= 12) {
      // 짧은 계좌번호 (예: 123-456-789012)
      return `${sanitized.slice(0, 3)}-${sanitized.slice(3, 6)}-${sanitized.slice(6)}`
    } else {
      // 긴 계좌번호 (예: 123456-78-901234)
      return `${sanitized.slice(0, 6)}-${sanitized.slice(6, 8)}-${sanitized.slice(8)}`
    }
  }
  
  return accountNumber // 패턴이 맞지 않으면 원본 반환
}

/**
 * Excel 내보내기용 계좌번호 포맷팅 (텍스트로 처리해 과학적 표기법 방지)
 * @param accountNumber - 계좌번호
 * @returns 앞에 apostrophe(')가 붙은 텍스트 (Excel에서 텍스트로 인식)
 */
export function formatAccountNumberForExcel(accountNumber: string): string {
  if (!accountNumber) return ''
  const sanitized = sanitizeAccountNumber(accountNumber)
  return sanitized ? `'${sanitized}` : ''
}

/**
 * 연락처 유효성 검증
 * @param phone - 연락처
 * @returns 유효성 검증 결과
 */
export function validatePhone(phone: string): { isValid: boolean; message?: string } {
  if (!phone) {
    return { isValid: false, message: '연락처를 입력해주세요' }
  }
  
  const sanitized = sanitizePhone(phone)
  
  // 010 시작 11자리 체크
  if (sanitized.length === 11 && sanitized.startsWith('010')) {
    return { isValid: true }
  }
  
  // 일반 전화번호 (지역번호 포함) 체크
  if (sanitized.length >= 9 && sanitized.length <= 11) {
    return { isValid: true }
  }
  
  return { 
    isValid: false, 
    message: '유효하지 않은 연락처 형식입니다 (010-0000-0000 형식으로 입력해주세요)' 
  }
}

/**
 * 입력 데이터 정제 (Import 시 사용)
 * @param rawData - 원본 데이터 객체
 * @returns 정제된 데이터 객체
 */
export function sanitizeDriverImportData(rawData: {
  [key: string]: string | undefined
}): {
  [key: string]: string | undefined
} {
  const result: { [key: string]: string | undefined } = {}
  
  for (const [key, value] of Object.entries(rawData)) {
    if (value === undefined || value === null) {
      result[key] = undefined
      continue
    }
    
    const stringValue = String(value).trim()
    
    if (!stringValue) {
      result[key] = undefined
      continue
    }
    
    // 연락처 정제
    if (key === 'phone' || key === '연락처') {
      result[key] = sanitizePhone(stringValue)
    }
    // 계좌번호 정제
    else if (key === 'accountNumber' || key === '계좌번호') {
      result[key] = sanitizeAccountNumber(stringValue)
    }
    // 일반 텍스트 필드
    else {
      result[key] = stringValue
    }
  }
  
  return result
}

/**
 * Excel/CSV 내보내기용 데이터 포맷팅
 * @param drivers - 기사 데이터 배열 (DB에서 조회된 데이터)
 * @returns 내보내기용으로 포맷팅된 데이터
 */
export function formatDriversForExport(drivers: any[]): any[] {
  return drivers.map(driver => ({
    '성함': driver.name || '',
    '연락처': formatPhoneForDisplay(driver.phone || ''),
    '차량번호': driver.vehicleNumber || '',
    '사업상호': driver.businessName || '',
    '대표자': driver.representative || '',
    '사업번호': driver.businessNumber || '',
    '계좌은행': driver.bankName || '',
    '계좌번호': formatAccountNumberForExcel(driver.accountNumber || ''),
    '특이사항': driver.remarks || ''
  }))
}

/**
 * 필수 필드 검증
 * @param data - 검증할 데이터
 * @returns 검증 결과
 */
export function validateRequiredFields(data: {
  name?: string
  phone?: string
  vehicleNumber?: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.name?.trim()) {
    errors.push('성함은 필수 입력 항목입니다')
  }
  
  if (!data.phone?.trim()) {
    errors.push('연락처는 필수 입력 항목입니다')
  }
  
  if (!data.vehicleNumber?.trim()) {
    errors.push('차량번호는 필수 입력 항목입니다')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}