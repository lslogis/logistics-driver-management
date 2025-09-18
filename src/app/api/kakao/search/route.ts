import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const size = searchParams.get('size') || '10'

    console.log('Kakao API request:', { query, size })

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY
    console.log('API Key available:', !!apiKey, 'Length:', apiKey?.length)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Kakao API key not configured' },
        { status: 500 }
      )
    }

    const kakaoUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=${size}`
    console.log('Kakao URL:', kakaoUrl)

    const response = await fetch(kakaoUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Kakao response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kakao API error response:', errorText)
      throw new Error(`Kakao API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Kakao response data:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Kakao API proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search address', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}