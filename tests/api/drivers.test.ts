import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/drivers/route'
import { testPrisma, createTestUser } from '../setup'

// Mock Next.js headers
const mockHeaders = new Headers()
mockHeaders.set('content-type', 'application/json')

describe('/api/drivers', () => {
  let testUserId: string

  beforeEach(async () => {
    const testUser = await createTestUser()
    testUserId = testUser.id
  })

  describe('GET /api/drivers', () => {
    beforeEach(async () => {
      // Create test drivers
      await testPrisma.driver.createMany({
        data: [
          {
            name: '김기사',
            phone: '010-1111-1111',
            businessNumber: '111-11-11111',
            bankName: '국민은행',
            accountNumber: '111111111',
            businessName: '김기사운송',
            representative: '김기사',
            isActive: true
          },
          {
            name: '박기사',
            phone: '010-2222-2222',
            businessNumber: '222-22-22222',
            bankName: '신한은행',
            accountNumber: '222222222',
            businessName: '박기사운송',
            representative: '박기사',
            isActive: false
          }
        ]
      })
    })

    it('should return drivers list successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'GET',
        headers: mockHeaders
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.drivers).toHaveLength(1) // Only active drivers
      expect(data.data.total).toBe(1)
    })

    it('should return drivers with pagination', async () => {
      const url = new URL('http://localhost:3000/api/drivers')
      url.searchParams.set('page', '1')
      url.searchParams.set('limit', '10')

      const request = new NextRequest(url, {
        method: 'GET',
        headers: mockHeaders
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data.page).toBe(1)
      expect(data.data.limit).toBe(10)
    })

    it('should include inactive drivers when requested', async () => {
      const url = new URL('http://localhost:3000/api/drivers')
      url.searchParams.set('includeInactive', 'true')

      const request = new NextRequest(url, {
        method: 'GET',
        headers: mockHeaders
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.drivers).toHaveLength(2) // Both active and inactive
    })

    it('should filter drivers by search term', async () => {
      const url = new URL('http://localhost:3000/api/drivers')
      url.searchParams.set('search', '김기사')

      const request = new NextRequest(url, {
        method: 'GET',
        headers: mockHeaders
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.drivers).toHaveLength(1)
      expect(data.data.drivers[0].name).toBe('김기사')
    })
  })

  describe('POST /api/drivers', () => {
    it('should create a new driver successfully', async () => {
      const driverData = {
        name: '새기사',
        phone: '010-9999-9999',
        businessNumber: '999-99-99999',
        bankName: '하나은행',
        accountNumber: '999999999',
        businessName: '새기사운송',
        representative: '새기사'
      }

      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify(driverData)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(driverData.name)
      expect(data.data.phone).toBe(driverData.phone)
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        phone: 'invalid-phone',
        businessNumber: '123'
      }

      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
    })

    it('should return 409 for duplicate business number', async () => {
      // First create a driver
      await testPrisma.driver.create({
        data: {
          name: '기존기사',
          phone: '010-1111-1111',
          businessNumber: '123-45-67890',
          bankName: '국민은행',
          accountNumber: '111111111',
          businessName: '기존운송',
          representative: '기존기사',
          isActive: true
        }
      })

      // Try to create driver with same business number
      const duplicateData = {
        name: '새기사',
        phone: '010-9999-9999',
        businessNumber: '123-45-67890', // Same as existing
        bankName: '신한은행',
        accountNumber: '999999999',
        businessName: '새기사운송',
        representative: '새기사'
      }

      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify(duplicateData)
      })

      const response = await POST(request)
      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('이미 존재')
    })
  })
})