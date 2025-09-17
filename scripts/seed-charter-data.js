#!/usr/bin/env node

/**
 * Charter 시스템 기본 데이터 시드 스크립트
 * 
 * Charter 시스템이 정상 작동하기 위한 기본 데이터를 생성합니다:
 * - CenterFare (센터별 요율)
 * - 기본 LoadingPoint (상차지)
 * - 기본 Driver (테스트용)
 * - 샘플 CharterRequest
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCharterData() {
  try {
    console.log('🚀 Charter 시스템 데이터 시드 시작...')

    // 1. 기본 LoadingPoint (상차지) 생성
    console.log('📍 상차지 생성...')
    
    const loadingPointsData = [
      {
        centerName: '서울센터',
        loadingPointName: '서울센터',
        roadAddress: '서울특별시 강남구 테헤란로 123',
        phone1: '02-1234-5678'
      },
      {
        centerName: '부산센터',
        loadingPointName: '부산센터',
        roadAddress: '부산광역시 해운대구 센텀중앙로 456',
        phone1: '051-9876-5432'
      },
      {
        centerName: '대구센터',
        loadingPointName: '대구센터',
        roadAddress: '대구광역시 수성구 동대구로 789',
        phone1: '053-5555-1234'
      }
    ]
    
    const loadingPoints = []
    for (const data of loadingPointsData) {
      const existing = await prisma.loadingPoint.findFirst({
        where: { centerName: data.centerName }
      })
      
      if (existing) {
        loadingPoints.push(existing)
        console.log(`   ⚠️  ${data.centerName} 이미 존재 (재사용)`)
      } else {
        const created = await prisma.loadingPoint.create({
          data: data
        })
        loadingPoints.push(created)
        console.log(`   ✅ ${data.centerName} 생성 완료`)
      }
    }
    
    console.log(`   ✅ ${loadingPoints.length}개 상차지 생성 완료`)

    // 2. CenterFare (센터별 요율) 생성
    console.log('💰 센터별 요율 생성...')
    
    const centerFares = []
    
    for (const center of loadingPoints) {
      // 각 센터별로 다양한 차종과 지역별 요율 생성
      const vehicleTypes = ['1톤', '2.5톤', '3.5톤', '5톤']
      const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산']
      
      for (const vehicleType of vehicleTypes) {
        for (const region of regions) {
          // 거리에 따른 기본 요율 설정 (서울 기준)
          let baseFare = 150000 // 기본 15만원
          
          // 차종별 요율 조정
          if (vehicleType === '1톤') baseFare = 120000
          else if (vehicleType === '2.5톤') baseFare = 150000
          else if (vehicleType === '3.5톤') baseFare = 180000
          else if (vehicleType === '5톤') baseFare = 220000
          
          // 지역별 거리 조정
          if (region === '서울') baseFare *= 0.8
          else if (region === '경기') baseFare *= 0.9
          else if (region === '인천') baseFare *= 1.0
          else if (region === '부산') baseFare *= 1.3
          else if (region === '대구') baseFare *= 1.2
          else if (region === '광주') baseFare *= 1.4
          else if (region === '대전') baseFare *= 1.1
          else if (region === '울산') baseFare *= 1.3
          
          const fare = await prisma.centerFare.upsert({
            where: {
              unique_center_vehicle_region: {
                centerId: center.id,
                vehicleType: vehicleType,
                region: region
              }
            },
            update: {},
            create: {
              centerId: center.id,
              vehicleType: vehicleType,
              region: region,
              fare: Math.round(baseFare),
              isActive: true
            }
          })
          
          centerFares.push(fare)
        }
      }
    }
    
    console.log(`   ✅ ${centerFares.length}개 센터별 요율 생성 완료`)

    // 3. 기본 Driver 생성 (테스트용)
    console.log('👤 테스트 기사 생성...')
    
    const driversData = [
      {
        name: '김기사',
        phone: '010-1234-5678',
        vehicleNumber: '서울12가1234',
        bankName: '국민은행',
        accountNumber: '123-456-789012'
      },
      {
        name: '이기사',
        phone: '010-9876-5432',
        vehicleNumber: '부산34나5678',
        bankName: '신한은행',
        accountNumber: '987-654-321098'
      },
      {
        name: '박기사',
        phone: '010-5555-1234',
        vehicleNumber: '대구56다9012',
        bankName: '우리은행',
        accountNumber: '555-123-456789'
      }
    ]
    
    const drivers = []
    for (const data of driversData) {
      const existing = await prisma.driver.findFirst({
        where: { phone: data.phone }
      })
      
      if (existing) {
        drivers.push(existing)
        console.log(`   ⚠️  ${data.name} (${data.phone}) 이미 존재 (재사용)`)
      } else {
        const created = await prisma.driver.create({
          data: data
        })
        drivers.push(created)
        console.log(`   ✅ ${data.name} 생성 완료`)
      }
    }
    
    console.log(`   ✅ ${drivers.length}개 테스트 기사 생성 완료`)

    // 4. 샘플 CharterRequest 생성
    console.log('🚛 샘플 용차 요청 생성...')
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const sampleCharters = []
    const vehicleTypes = ['3.5톤', '5톤', '2.5톤']
    
    for (let i = 0; i < 3; i++) {
      const center = loadingPoints[i % loadingPoints.length]
      const driver = drivers[i % drivers.length]
      const vehicleType = vehicleTypes[i % vehicleTypes.length]
      
      // 해당 센터와 차종에 맞는 요율 찾기
      const centerFare = centerFares.find(cf => 
        cf.centerId === center.id && 
        cf.vehicleType === vehicleType &&
        cf.region === '서울'
      )
      
      if (centerFare) {
        const charter = await prisma.charterRequest.create({
          data: {
            centerId: center.id,
            vehicleType: vehicleType,
            date: tomorrow,
            isNegotiated: false,
            baseFare: centerFare.fare,
            regionFare: 0,
            stopFare: 0,
            extraFare: 0,
            totalFare: centerFare.fare,
            driverId: driver.id,
            driverFare: Math.round(centerFare.fare * 0.85), // 기사는 85%
            notes: `샘플 용차 요청 ${i + 1}`,
            destinations: {
              create: [
                {
                  region: '서울',
                  order: 1
                }
              ]
            }
          }
        })
        
        sampleCharters.push(charter)
      }
    }
    
    console.log(`   ✅ ${sampleCharters.length}개 샘플 용차 요청 생성 완료`)

    // 5. 데이터 요약 출력
    console.log('\n📊 생성된 데이터 요약:')
    console.log(`   상차지: ${loadingPoints.length}개`)
    console.log(`   센터별 요율: ${centerFares.length}개`)
    console.log(`   테스트 기사: ${drivers.length}개`)
    console.log(`   샘플 용차 요청: ${sampleCharters.length}개`)
    
    console.log('\n✅ Charter 시스템 데이터 시드 완료!')
    console.log('\n다음 단계:')
    console.log('1. /charters 페이지에서 용차 요청 확인')
    console.log('2. 새로운 용차 요청 생성 테스트')
    console.log('3. 센터별 요율 관리 테스트')

  } catch (error) {
    console.error('❌ Charter 데이터 시드 중 오류:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  seedCharterData()
}

module.exports = { seedCharterData }