import { redirect } from 'next/navigation'

/**
 * 기존 운행(Trips) 페이지 리다이렉트
 * 
 * 용차 관리 시스템이 /charters로 전면 이전되었습니다.
 * 기존 /trips 접근을 새로운 /charters 페이지로 301 리다이렉트 처리합니다.
 * 
 * @deprecated 용차 관리는 /charters에서 이용해주세요
 */
export default function TripsRedirectPage() {
  // 서버 컴포넌트에서 즉시 리다이렉트 (301 Permanent)
  redirect('/charters')
}

// 페이지 메타데이터
export const metadata = {
  title: '용차 관리 - 페이지 이동됨',
  description: '용차 관리 페이지가 /charters로 이동되었습니다.',
  robots: 'noindex, nofollow'
}