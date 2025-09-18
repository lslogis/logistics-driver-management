import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryClientProvider'
import SessionProvider from '@/components/providers/SessionProvider'
import ToastProvider from '@/components/providers/ToastProvider'
import AdminLayout from '@/components/layout/AdminLayout'
import KakaoScript from '@/components/KakaoScript'

// Optimized Inter font configuration
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont', 
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Open Sans',
    'Helvetica Neue',
    'sans-serif'
  ],
  adjustFontFallback: true,
  variable: '--font-inter'
})

// 전역 동적 렌더링 강제
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: '운송기사관리 시스템',
  description: '운송 기사, 차량, 운행, 정산을 통합 관리하는 시스템',
  other: {
    // Prevent font preload warnings
    'dns-prefetch': 'https://fonts.googleapis.com',
    'preconnect': 'https://fonts.googleapis.com',
    'preconnect-crossorigin': 'https://fonts.gstatic.com'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <script src="https://developers.kakao.com/sdk/js/kakao.js" async></script>
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <KakaoScript />
        <SessionProvider>
          <QueryProvider>
            <AdminLayout>
              {children}
            </AdminLayout>
            <ToastProvider />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}