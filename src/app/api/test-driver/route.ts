import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing simple driver query...')
    
    // Simple findFirst query that should work
    const existingDriver = await prisma.driver.findFirst({
      where: {
        phone: '010-1234-5678'
      }
    })
    
    return NextResponse.json({
      ok: true,
      message: 'Query successful',
      driver: existingDriver
    })
  } catch (error) {
    console.error('Test query failed:', error)
    
    return NextResponse.json({
      ok: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}