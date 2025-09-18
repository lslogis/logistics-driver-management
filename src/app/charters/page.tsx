'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function LegacyChartersRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/requests')
  }, [router])

  return null
}
