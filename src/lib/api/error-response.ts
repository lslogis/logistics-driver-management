import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
  message?: string
}

// 공통 에러 응답 생성 헬퍼
export function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      error: {
        message,
        code,
        details
      }
    },
    { status }
  )
}

// Zod 검증 에러 응답
export function createValidationErrorResponse(
  error: ZodError
): NextResponse<ApiResponse> {
  const formattedErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))

  return NextResponse.json(
    {
      error: {
        message: '입력값이 올바르지 않습니다',
        code: 'VALIDATION_ERROR',
        details: formattedErrors
      }
    },
    { status: 400 }
  )
}

// 성공 응답 생성 헬퍼
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      message
    },
    { status }
  )
}

// 공통 에러 타입들
export const ApiErrors = {
  NOT_FOUND: (resource: string) => ({
    message: `${resource}을(를) 찾을 수 없습니다`,
    code: 'NOT_FOUND'
  }),
  ALREADY_EXISTS: (resource: string) => ({
    message: `${resource}이(가) 이미 존재합니다`,
    code: 'ALREADY_EXISTS'
  }),
  UNAUTHORIZED: {
    message: '인증이 필요합니다',
    code: 'UNAUTHORIZED'
  },
  FORBIDDEN: {
    message: '권한이 없습니다',
    code: 'FORBIDDEN'
  },
  INTERNAL_ERROR: {
    message: '서버 오류가 발생했습니다',
    code: 'INTERNAL_ERROR'
  }
} as const