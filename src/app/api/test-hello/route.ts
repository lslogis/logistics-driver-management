import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  console.log('🔥 Test Hello API called!')
  
  return NextResponse.json({
    message: 'Hello World!',
    timestamp: new Date().toISOString(),
    updated: true
  })
}