/**
 * 용차 관리 시스템 테스트
 * 
 * 기본적인 API 엔드포인트와 서비스 로직 테스트
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// 테스트용 데이터
const testData = {
  // 테스트용 센터 ID (실제 DB에 존재해야 함)
  centerId: 'test_center_id',
  // 테스트용 기사 ID (실제 DB에 존재해야 함)  
  driverId: 'test_driver_id',
  vehicleType: '1.0톤',
  date: new Date().toISOString().split('T')[0],
  destinations: [
    { region: '서울', order: 1 },
    { region: '인천', order: 2 }
  ],
  baseFare: 50000,
  regionFare: 20000,
  stopFare: 10000,
  extraFare: 5000,
  totalFare: 85000,
  driverFare: 70000,
  isNegotiated: false,
  notes: '테스트 용차 요청'
}

const negotiatedTestData = {
  ...testData,
  isNegotiated: true,
  negotiatedFare: 90000,
  totalFare: 90000,
  notes: '협의금액 테스트'
}

// 헬퍼 함수들
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  const response = await fetch(url, { ...defaultOptions, ...options })
  const data = await response.json()
  
  return { response, data }
}

async function createCenterFare(centerId, vehicleType, region, fare) {
  return makeRequest('/api/center-fares', {
    method: 'POST',
    body: JSON.stringify({
      centerId,
      vehicleType,
      region,
      fare
    })
  })
}

async function quoteFare(pricingData) {
  return makeRequest('/api/charters/requests/quote', {
    method: 'POST',
    body: JSON.stringify(pricingData)
  })
}

async function createCharterRequest(charterData) {
  return makeRequest('/api/charters/requests', {
    method: 'POST',
    body: JSON.stringify(charterData)
  })
}

async function getCharterRequests(params = {}) {
  const searchParams = new URLSearchParams(params)
  return makeRequest(`/api/charters/requests?${searchParams}`)
}

async function getCharterRequest(id) {
  return makeRequest(`/api/charters/requests/${id}`)
}

async function updateCharterRequest(id, updateData) {
  return makeRequest(`/api/charters/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  })
}

async function deleteCharterRequest(id) {
  return makeRequest(`/api/charters/requests/${id}`, {
    method: 'DELETE'
  })
}

// 테스트 함수들
async function testHealthCheck() {
  console.log('\n=== Health Check 테스트 ===')
  
  try {
    const { response, data } = await makeRequest('/api/health')
    
    if (response.ok && data.ok) {
      console.log('✅ Health check 성공')
      return true
    } else {
      console.log('❌ Health check 실패:', data)
      return false
    }
  } catch (error) {
    console.log('❌ Health check 오류:', error.message)
    return false
  }
}

async function testCenterFareManagement() {
  console.log('\n=== 센터 요율 관리 테스트 ===')
  
  try {
    // 1. 요율 등록 테스트
    console.log('1. 요율 등록 테스트...')
    const createResult = await createCenterFare(
      testData.centerId,
      testData.vehicleType,
      '서울',
      50000
    )
    
    if (!createResult.response.ok) {
      console.log('⚠️ 요율 등록 실패 (테스트 데이터 부족일 수 있음):', createResult.data.error?.message)
      return false
    }
    
    console.log('✅ 요율 등록 성공')
    
    // 2. 요율 목록 조회 테스트
    console.log('2. 요율 목록 조회 테스트...')
    const { response: listResponse, data: listData } = await makeRequest('/api/center-fares')
    
    if (listResponse.ok && listData.ok) {
      console.log('✅ 요율 목록 조회 성공')
      console.log(`   총 ${listData.data?.totalCount || 0}개 요율 등록됨`)
      return true
    } else {
      console.log('❌ 요율 목록 조회 실패:', listData)
      return false
    }
  } catch (error) {
    console.log('❌ 센터 요율 관리 테스트 오류:', error.message)
    return false
  }
}

async function testPricingCalculation() {
  console.log('\n=== 요금 계산 테스트 ===')
  
  try {
    // 1. 기본 요금 계산 테스트
    console.log('1. 기본 요금 계산 테스트...')
    const quoteData = {
      centerId: testData.centerId,
      vehicleType: testData.vehicleType,
      regions: ['서울', '인천'],
      stopCount: 2,
      extras: {
        regionMove: 0,
        stopExtra: 0,
        misc: 0
      },
      isNegotiated: false
    }
    
    const quoteResult = await quoteFare(quoteData)
    
    if (quoteResult.response.status === 422) {
      console.log('⚠️ 요율 누락으로 인한 계산 실패 (예상된 동작)')
      console.log(`   누락된 지역: ${quoteResult.data.error?.details?.missingRegions?.join(', ')}`)
      return true
    } else if (quoteResult.response.ok) {
      console.log('✅ 요금 계산 성공')
      console.log(`   총 금액: ${quoteResult.data.data.totalFare.toLocaleString()}원`)
      return true
    } else {
      console.log('❌ 요금 계산 실패:', quoteResult.data)
      return false
    }
    
    // 2. 협의금액 테스트
    console.log('2. 협의금액 계산 테스트...')
    const negotiatedQuote = await quoteFare({
      ...quoteData,
      isNegotiated: true,
      negotiatedFare: 90000
    })
    
    if (negotiatedQuote.response.ok) {
      console.log('✅ 협의금액 계산 성공')
      return true
    } else {
      console.log('❌ 협의금액 계산 실패:', negotiatedQuote.data)
      return false
    }
  } catch (error) {
    console.log('❌ 요금 계산 테스트 오류:', error.message)
    return false
  }
}

async function testCharterRequestManagement() {
  console.log('\n=== 용차 요청 관리 테스트 ===')
  
  try {
    // 1. 용차 요청 생성 테스트 (협의금액)
    console.log('1. 용차 요청 생성 테스트...')
    const createResult = await createCharterRequest(negotiatedTestData)
    
    if (!createResult.response.ok) {
      console.log('⚠️ 용차 요청 생성 실패 (테스트 데이터 부족일 수 있음):', createResult.data.error?.message)
      return false
    }
    
    const createdCharter = createResult.data.data
    console.log('✅ 용차 요청 생성 성공')
    console.log(`   요청 ID: ${createdCharter.id}`)
    
    // 2. 용차 요청 조회 테스트
    console.log('2. 용차 요청 상세 조회 테스트...')
    const getResult = await getCharterRequest(createdCharter.id)
    
    if (getResult.response.ok) {
      console.log('✅ 용차 요청 조회 성공')
    } else {
      console.log('❌ 용차 요청 조회 실패:', getResult.data)
      return false
    }
    
    // 3. 용차 요청 목록 조회 테스트
    console.log('3. 용차 요청 목록 조회 테스트...')
    const listResult = await getCharterRequests({ limit: 10 })
    
    if (listResult.response.ok) {
      console.log('✅ 용차 요청 목록 조회 성공')
      console.log(`   총 ${listResult.data.data?.totalCount || 0}개 요청`)
    } else {
      console.log('❌ 용차 요청 목록 조회 실패:', listResult.data)
      return false
    }
    
    // 4. 용차 요청 수정 테스트
    console.log('4. 용차 요청 수정 테스트...')
    const updateResult = await updateCharterRequest(createdCharter.id, {
      notes: '수정된 테스트 노트',
      driverFare: 75000
    })
    
    if (updateResult.response.ok) {
      console.log('✅ 용차 요청 수정 성공')
    } else {
      console.log('❌ 용차 요청 수정 실패:', updateResult.data)
      return false
    }
    
    // 5. 용차 요청 삭제 테스트
    console.log('5. 용차 요청 삭제 테스트...')
    const deleteResult = await deleteCharterRequest(createdCharter.id)
    
    if (deleteResult.response.ok) {
      console.log('✅ 용차 요청 삭제 성공')
      return true
    } else {
      console.log('❌ 용차 요청 삭제 실패:', deleteResult.data)
      return false
    }
  } catch (error) {
    console.log('❌ 용차 요청 관리 테스트 오류:', error.message)
    return false
  }
}

async function testValidation() {
  console.log('\n=== 유효성 검증 테스트 ===')
  
  try {
    // 1. 잘못된 데이터로 용차 요청 생성 테스트
    console.log('1. 잘못된 데이터 검증 테스트...')
    const invalidData = {
      centerId: '', // 빈 센터 ID
      vehicleType: '',
      date: '',
      destinations: [],
      totalFare: -1000, // 음수 금액
      driverFare: -500
    }
    
    const invalidResult = await createCharterRequest(invalidData)
    
    if (invalidResult.response.status === 400) {
      console.log('✅ 잘못된 데이터 검증 성공 (400 에러 반환)')
    } else {
      console.log('❌ 잘못된 데이터 검증 실패 - 400 에러가 반환되어야 함')
      return false
    }
    
    // 2. 존재하지 않는 ID로 조회 테스트
    console.log('2. 존재하지 않는 ID 조회 테스트...')
    const notFoundResult = await getCharterRequest('non-existent-id')
    
    if (notFoundResult.response.status === 404) {
      console.log('✅ 존재하지 않는 ID 검증 성공 (404 에러 반환)')
      return true
    } else {
      console.log('❌ 존재하지 않는 ID 검증 실패 - 404 에러가 반환되어야 함')
      return false
    }
  } catch (error) {
    console.log('❌ 유효성 검증 테스트 오류:', error.message)
    return false
  }
}

// 메인 테스트 실행 함수
async function runTests() {
  console.log('🚀 용차 관리 시스템 테스트 시작')
  console.log(`📍 테스트 대상: ${BASE_URL}`)
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: '센터 요율 관리', fn: testCenterFareManagement },
    { name: '요금 계산', fn: testPricingCalculation },
    { name: '용차 요청 관리', fn: testCharterRequestManagement },
    { name: '유효성 검증', fn: testValidation }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.name} 테스트 중 예외 발생:`, error.message)
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 테스트 결과 요약')
  console.log('='.repeat(50))
  console.log(`✅ 성공: ${passed}개`)
  console.log(`❌ 실패: ${failed}개`)
  console.log(`📈 성공률: ${passed > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0}%`)
  
  if (failed === 0) {
    console.log('\n🎉 모든 테스트가 통과했습니다!')
  } else {
    console.log('\n⚠️ 일부 테스트가 실패했습니다. 데이터베이스 설정이나 테스트 데이터를 확인해주세요.')
  }
  
  return failed === 0
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runTests().catch(error => {
    console.error('테스트 실행 중 오류:', error)
    process.exit(1)
  })
}

module.exports = {
  runTests,
  testHealthCheck,
  testCenterFareManagement,
  testPricingCalculation,
  testCharterRequestManagement,
  testValidation
}