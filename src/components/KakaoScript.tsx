'use client'

import { useEffect } from 'react'

export default function KakaoScript() {
  useEffect(() => {
    // 동적으로 카카오 SDK 스크립트 로드
    const loadKakaoSDK = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 Kakao 객체가 있으면 바로 resolve
        if ((window as any).Kakao) {
          console.log('카카오 SDK 이미 로드됨')
          resolve()
          return
        }

        // 이미 스크립트 태그가 있는지 확인
        if (document.querySelector('script[src*="kakao"]')) {
          console.log('카카오 스크립트 태그 이미 존재')
          // 스크립트는 있지만 Kakao 객체가 없으면 로딩 대기
          const checkKakao = setInterval(() => {
            if ((window as any).Kakao) {
              clearInterval(checkKakao)
              resolve()
            }
          }, 100)
          
          setTimeout(() => {
            clearInterval(checkKakao)
            reject(new Error('카카오 SDK 로딩 시간 초과'))
          }, 10000)
          return
        }

        // 새로운 스크립트 태그 생성
        const script = document.createElement('script')
        script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
        script.onload = () => {
          console.log('카카오 SDK 동적 로드 완료')
          resolve()
        }
        script.onerror = () => {
          console.error('카카오 SDK 동적 로드 실패')
          reject(new Error('카카오 SDK 로드 실패'))
        }
        
        document.head.appendChild(script)
        console.log('카카오 SDK 스크립트 동적 로드 시작')
      })
    }

    const initKakao = async () => {
      try {
        await loadKakaoSDK()
        
        if ((window as any).Kakao) {
          console.log('카카오 SDK 발견됨:', (window as any).Kakao)
          
          const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY
          if (kakaoKey && !(window as any).Kakao.isInitialized()) {
            try {
              (window as any).Kakao.init(kakaoKey)
              console.log('카카오 SDK 초기화 성공')
            } catch (error) {
              console.error('카카오 SDK 초기화 실패:', error)
            }
          } else if ((window as any).Kakao.isInitialized()) {
            console.log('카카오 SDK 이미 초기화됨')
          } else {
            console.error('카카오 JavaScript 키가 없습니다:', kakaoKey)
          }
        }
      } catch (error) {
        console.error('카카오 SDK 로드/초기화 실패:', error)
      }
    }

    initKakao()
  }, [])

  return null
}