/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // TypeScript 엄격 모드
  typescript: {
    // 빌드 시 타입 에러가 있어도 계속 진행 (개발 단계)
    ignoreBuildErrors: false,
  },
  eslint: {
    // 빌드 시 ESLint 에러가 있어도 계속 진행 (개발 단계)
    ignoreDuringBuilds: false,
  },
  // 개발 모드에서 파일 감지 개선 (Docker/WSL 환경)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000, // 1초마다 파일 변경 확인
        aggregateTimeout: 300, // 300ms 후 재빌드
      }
    }
    return config
  },
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig