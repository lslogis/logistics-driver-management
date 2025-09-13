/**
 * 공유 관련 유틸리티 함수들
 */

// 클립보드 복사
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 모던 브라우저에서 Clipboard API 사용
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 레거시 브라우저 지원
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      return result
    }
  } catch (error) {
    console.error('클립보드 복사 실패:', error)
    return false
  }
}

// 기사 정보 텍스트 포맷
export function formatDriverInfo(driver: {
  name: string
  phone?: string | null
  vehicleNumber?: string | null
  businessName?: string | null
  bankName?: string | null
  accountNumber?: string | null
}) {
  const lines = [`👤 기사: ${driver.name}`]
  
  if (driver.phone) {
    lines.push(`📞 연락처: ${driver.phone}`)
  }
  
  if (driver.vehicleNumber) {
    lines.push(`🚛 차량번호: ${driver.vehicleNumber}`)
  }
  
  if (driver.businessName) {
    lines.push(`🏢 사업상호: ${driver.businessName}`)
  }
  
  if (driver.bankName && driver.accountNumber) {
    lines.push(`💳 계좌: ${driver.bankName} ${driver.accountNumber}`)
  }
  
  return lines.join('\n')
}

// 상차지 정보 텍스트 포맷
export function formatLoadingPointInfo(loadingPoint: {
  centerName: string
  loadingPointName: string
  lotAddress?: string | null
  roadAddress?: string | null
  manager1?: string | null
  manager2?: string | null
  phone1?: string | null
  phone2?: string | null
  remarks?: string | null
}) {
  const lines = [
    `🏭 센터명: ${loadingPoint.centerName}`,
    `📍 상차지: ${loadingPoint.loadingPointName}`
  ]
  
  if (loadingPoint.roadAddress) {
    lines.push(`🗺️ 주소: ${loadingPoint.roadAddress}`)
  } else if (loadingPoint.lotAddress) {
    lines.push(`🗺️ 주소: ${loadingPoint.lotAddress}`)
  }
  
  if (loadingPoint.manager1) {
    lines.push(`👤 담당자1: ${loadingPoint.manager1}`)
    if (loadingPoint.phone1) {
      lines.push(`📞 연락처1: ${loadingPoint.phone1}`)
    }
  }
  
  if (loadingPoint.manager2) {
    lines.push(`👤 담당자2: ${loadingPoint.manager2}`)
    if (loadingPoint.phone2) {
      lines.push(`📞 연락처2: ${loadingPoint.phone2}`)
    }
  }
  
  if (loadingPoint.remarks) {
    lines.push(`📝 비고: ${loadingPoint.remarks}`)
  }
  
  return lines.join('\n')
}

// 고정노선 정보 텍스트 포맷
export function formatFixedRouteInfo(fixedRoute: {
  routeName: string
  loadingPoint?: {
    centerName: string
    loadingPointName: string
  } | null
  assignedDriver?: {
    name: string
    phone: string
  } | null
  contractType: string
  revenueDaily?: number | null
  costDaily?: number | null
  weekdayPattern?: number[] | null
}) {
  const lines = [`🛣️ 노선: ${fixedRoute.routeName}`]
  
  if (fixedRoute.loadingPoint) {
    lines.push(`🏭 상차지: ${fixedRoute.loadingPoint.centerName} ${fixedRoute.loadingPoint.loadingPointName}`)
  }
  
  if (fixedRoute.assignedDriver) {
    lines.push(`👤 배정기사: ${fixedRoute.assignedDriver.name}`)
    lines.push(`📞 연락처: ${fixedRoute.assignedDriver.phone}`)
  }
  
  const contractLabels: Record<string, string> = {
    'FIXED_DAILY': '고정(일대)',
    'FIXED_MONTHLY': '고정(월대)',
    'CONSIGNED_MONTHLY': '지입(월대+경비)'
  }
  
  lines.push(`📄 계약형태: ${contractLabels[fixedRoute.contractType] || fixedRoute.contractType}`)
  
  if (fixedRoute.revenueDaily) {
    lines.push(`💰 일매출: ${fixedRoute.revenueDaily.toLocaleString()}원`)
  }
  
  if (fixedRoute.costDaily) {
    lines.push(`💸 일비용: ${fixedRoute.costDaily.toLocaleString()}원`)
  }
  
  if (fixedRoute.weekdayPattern && fixedRoute.weekdayPattern.length > 0) {
    const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
    const days = fixedRoute.weekdayPattern.map(day => weekdayLabels[day]).join(', ')
    lines.push(`📅 운행요일: ${days}`)
  }
  
  return lines.join('\n')
}

// 운행 정보 텍스트 포맷
export function formatTripInfo(trip: {
  date: string
  status: string
  driver: {
    name: string
    phone: string
  }
  vehicle: {
    plateNumber: string
    vehicleType: string
  }
  routeTemplate?: {
    name: string
    loadingPoint: string
    unloadingPoint: string
  } | null
  customRoute?: {
    loadingPoint: string
    unloadingPoint: string
  } | null
  driverFare: string
  billingFare: string
  deductionAmount?: string
  substituteFare?: string
  substituteDriver?: {
    name: string
  } | null
  absenceReason?: string
  remarks?: string
}) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(parseInt(amount))
  }

  const statusLabels: Record<string, string> = {
    'SCHEDULED': '예정',
    'COMPLETED': '완료',
    'ABSENCE': '결행',
    'SUBSTITUTE': '대차'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const lines = [
    `🚛 운행 정보`,
    `📅 운행일: ${formatDate(trip.date)}`,
    `📊 상태: ${statusLabels[trip.status] || trip.status}`
  ]
  
  lines.push(`👤 기사: ${trip.driver.name}`)
  lines.push(`📞 연락처: ${trip.driver.phone}`)
  lines.push(`🚗 차량: ${trip.vehicle.plateNumber} (${trip.vehicle.vehicleType})`)
  
  if (trip.routeTemplate) {
    lines.push(`🛣️ 노선: ${trip.routeTemplate.name}`)
    lines.push(`📍 경로: ${trip.routeTemplate.loadingPoint} → ${trip.routeTemplate.unloadingPoint}`)
  } else if (trip.customRoute) {
    lines.push(`🛣️ 노선: 커스텀`)
    lines.push(`📍 경로: ${trip.customRoute.loadingPoint} → ${trip.customRoute.unloadingPoint}`)
  }
  
  lines.push(`💰 기사요금: ${formatCurrency(trip.driverFare)}`)
  lines.push(`💳 청구요금: ${formatCurrency(trip.billingFare)}`)
  
  if (trip.deductionAmount) {
    lines.push(`💸 차감액: ${formatCurrency(trip.deductionAmount)}`)
  }
  
  if (trip.substituteFare) {
    lines.push(`🔄 대차요금: ${formatCurrency(trip.substituteFare)}`)
  }
  
  if (trip.substituteDriver) {
    lines.push(`🔄 대차기사: ${trip.substituteDriver.name}`)
  }
  
  if (trip.absenceReason) {
    lines.push(`❌ 결행사유: ${trip.absenceReason}`)
  }
  
  if (trip.remarks) {
    lines.push(`📝 비고: ${trip.remarks}`)
  }
  
  return lines.join('\n')
}

// SMS 발송 (기본 SMS 앱 연동)
export function sendSMS(phoneNumber: string, message: string) {
  // 전화번호 정규화 (특수문자 제거)
  const normalizedPhone = phoneNumber.replace(/[^\d]/g, '')
  
  if (normalizedPhone.length === 0) {
    throw new Error('유효한 전화번호가 없습니다')
  }
  
  // SMS URL 스키마 사용
  const smsUrl = `sms:${normalizedPhone}?body=${encodeURIComponent(message)}`
  
  // 모바일 감지
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (isMobile) {
    // 모바일에서는 직접 SMS 앱 실행
    window.location.href = smsUrl
  } else {
    // 데스크톱에서는 새 창으로 열기
    window.open(smsUrl, '_blank')
  }
}

// 카카오 SDK 로드 대기 함수
function waitForKakaoSDK(maxWaitTime = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const checkKakao = () => {
      if ((window as any).Kakao) {
        resolve((window as any).Kakao)
        return
      }
      
      if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('카카오 SDK 로딩 시간 초과'))
        return
      }
      
      setTimeout(checkKakao, 100)
    }
    
    checkKakao()
  })
}

// 카카오톡 공유하기
export async function shareToKakao(title: string, description: string, url?: string) {
  console.log('shareToKakao 호출됨:', { title, description, url })
  
  if (typeof window === 'undefined') {
    console.log('서버사이드 환경에서 호출됨')
    return
  }
  
  try {
    // 카카오 SDK 대기 시간을 늘려서 확실히 로드될 때까지 기다림
    const Kakao = await waitForKakaoSDK(5000) // 5초 대기
    
    if (Kakao && Kakao.isInitialized()) {
      console.log('카카오 SDK 사용 가능 - 공유 시작')
      
      // 카카오톡 공유 실행 - text 타입은 link가 필수
      const currentUrl = url || window.location.href // URL이 없으면 현재 페이지 URL 사용
      
      const shareObject = {
        objectType: 'text',
        text: `${title}\n\n${description}`,
        link: {
          mobileWebUrl: currentUrl,
          webUrl: currentUrl
        }
      }
      
      console.log('카카오 공유 객체:', shareObject)
      Kakao.Share.sendDefault(shareObject)
      
      console.log('카카오 공유 요청 전송 완료')
      return // 성공적으로 공유했으면 함수 종료
      
    } else {
      console.log('카카오 SDK가 초기화되지 않음')
      throw new Error('카카오 SDK 초기화 안됨')
    }
    
  } catch (error) {
    console.log('카카오 공유 실패, 클립보드 복사로 대체:', error)
    
    // 카카오 공유 실패시 대체 방법
    try {
      const success = await copyToClipboard(`${title}\n\n${description}${url ? '\n\n' + url : ''}`)
      if (success) {
        alert('카카오톡이 설치되지 않아 클립보드에 복사되었습니다')
      } else {
        throw new Error('클립보드 복사 실패')
      }
    } catch (clipboardError) {
      console.error('클립보드 복사 실패:', clipboardError)
      alert('공유 기능을 사용할 수 없습니다')
    }
  }
}

// 전화 걸기
export function makePhoneCall(phoneNumber: string) {
  const normalizedPhone = phoneNumber.replace(/[^\d]/g, '')
  
  if (normalizedPhone.length === 0) {
    throw new Error('유효한 전화번호가 없습니다')
  }
  
  // tel: URL 스키마 사용
  window.location.href = `tel:${normalizedPhone}`
}

// 이메일 보내기
export function sendEmail(email: string, subject?: string, body?: string) {
  const params = new URLSearchParams()
  if (subject) params.append('subject', subject)
  if (body) params.append('body', body)
  
  const mailtoUrl = `mailto:${email}${params.toString() ? '?' + params.toString() : ''}`
  window.location.href = mailtoUrl
}

// 공유 가능 여부 확인
export function canShare(): {
  clipboard: boolean
  sms: boolean
  kakao: boolean
  webShare: boolean
  phone: boolean
} {
  return {
    clipboard: !!(navigator.clipboard || document.execCommand),
    sms: true, // SMS는 대부분 지원
    kakao: typeof window !== 'undefined' && !!(window as any).Kakao,
    webShare: !!(navigator.share),
    phone: true // 전화는 대부분 지원
  }
}

// 카카오 SDK 상태 확인 (디버깅용)
export function checkKakaoStatus() {
  if (typeof window === 'undefined') {
    console.log('서버사이드 환경')
    return { status: 'server-side' }
  }

  const Kakao = (window as any).Kakao
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY

  const status = {
    sdkLoaded: !!Kakao,
    keyAvailable: !!kakaoKey,
    keyValue: kakaoKey,
    initialized: Kakao ? Kakao.isInitialized() : false,
    shareAvailable: Kakao && Kakao.Share ? true : false
  }

  console.log('카카오 SDK 상태:', status)
  return status
}

// 전역에 디버깅 함수 추가 (개발환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).checkKakaoStatus = checkKakaoStatus
}