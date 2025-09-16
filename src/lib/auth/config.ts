import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      isActive: boolean
    }
  }
  
  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    isActive: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    isActive: boolean
  }
}

export const authOptions: NextAuthOptions = {
  // 세션 암호화를 위한 보안 키 (필수)
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        // 사용자 조회
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
          }
        })

        if (!user) {
          throw new Error('등록되지 않은 이메일입니다.')
        }

        if (!user.isActive) {
          throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.')
        }

        if (!user.password) {
          throw new Error('비밀번호가 설정되지 않은 계정입니다.')
        }

        // 비밀번호 확인
        const isPasswordValid = await compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          throw new Error('비밀번호가 올바르지 않습니다.')
        }

        // 로그인 시간 업데이트
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24시간
  },
  
  jwt: {
    maxAge: 24 * 60 * 60, // 24시간
    // JWT 서명을 위한 시크릿 명시적 설정 (보안 강화)
    secret: process.env.NEXTAUTH_SECRET,
  },
  
  callbacks: {
    async jwt({ token, user }) {
      // 로그인 시점에 사용자 정보를 JWT에 저장
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isActive = user.isActive
      }
      return token
    },
    
    async session({ session, token }) {
      // JWT에서 세션으로 사용자 정보 전달
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.isActive = token.isActive
      }
      return session
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  events: {
    async signIn({ user }) {
      // 감사 로그: 로그인 기록
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          changes: {
            loginTime: new Date().toISOString(),
            userAgent: 'Unknown' // 클라이언트에서 추가 정보 필요
          }
        }
      }).catch(console.error) // 로그인 실패를 방지하기 위해 에러 무시
    },
    
    async signOut({ token }) {
      // 감사 로그: 로그아웃 기록
      if (token?.id) {
        await prisma.auditLog.create({
          data: {
            userId: token.id as string,
            userName: token.name as string,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: token.id as string,
            changes: {
              logoutTime: new Date().toISOString()
            }
          }
        }).catch(console.error)
      }
    }
  }
}