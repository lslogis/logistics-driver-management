'use client'

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">500</h1>
        <p className="text-gray-600 mb-4">서버 오류가 발생했습니다.</p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}