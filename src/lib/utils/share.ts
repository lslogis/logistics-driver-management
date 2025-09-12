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
  phone?: string
  vehicleNumber?: string
  businessName?: string
  bankName?: string
  accountNumber?: string
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
  (window as any).testKakaoShare = async () => {
    try {
      await shareToKakao('테스트', '카카오톡 공유 테스트입니다')
      console.log('테스트 공유 성공')
    } catch (error) {
      console.error('테스트 공유 실패:', error)
    }
  }
}