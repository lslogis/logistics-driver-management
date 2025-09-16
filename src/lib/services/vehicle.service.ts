import { PrismaClient } from '@prisma/client'
import { CreateVehicleData, UpdateVehicleData, GetVehiclesQuery, VehicleResponse, VehiclesListResponse } from '@/lib/validations/vehicle'

export class VehicleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 차량 목록 조회 (검색, 필터링, 페이지네이션)
   * TODO: Implement proper vehicle management (currently using vehicleNumber in Driver model)
   */
  async getVehicles(query: GetVehiclesQuery): Promise<VehiclesListResponse> {
    const { page = 1, limit = 20 } = query
    
    return {
      vehicles: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * 차량 상세 조회
   * TODO: Implement with proper Vehicle model
   */
  async getVehicleById(id: string): Promise<VehicleResponse | null> {
    return null
  }

  /**
   * 차량 생성
   * TODO: Implement with proper Vehicle model
   */
  async createVehicle(data: CreateVehicleData): Promise<VehicleResponse> {
    throw new Error('Vehicle management is not implemented - vehicle info is stored in Driver.vehicleNumber')
  }

  /**
   * 차량 정보 수정
   * TODO: Implement with proper Vehicle model
   */
  async updateVehicle(id: string, data: UpdateVehicleData): Promise<VehicleResponse> {
    throw new Error('Vehicle management is not implemented - vehicle info is stored in Driver.vehicleNumber')
  }

  /**
   * 차량 삭제 (소프트 삭제)
   * TODO: Implement with proper Vehicle model
   */
  async deleteVehicle(id: string): Promise<void> {
    throw new Error('Vehicle management is not implemented - vehicle info is stored in Driver.vehicleNumber')
  }

  /**
   * 차량 활성화/비활성화
   * TODO: Implement with proper Vehicle model
   */
  async toggleVehicleStatus(id: string): Promise<VehicleResponse> {
    throw new Error('Vehicle management is not implemented - vehicle info is stored in Driver.vehicleNumber')
  }

  /**
   * 차량에 기사 배정
   * TODO: Implement with proper Vehicle model
   */
  async assignDriverToVehicle(vehicleId: string, driverId: string): Promise<VehicleResponse> {
    throw new Error('Vehicle management is not implemented - vehicle info is stored in Driver.vehicleNumber')
  }

  /**
   * 차량에서 기사 배정 해제
   * TODO: Implement with proper Vehicle model
   */
  async unassignDriverFromVehicle(vehicleId: string): Promise<VehicleResponse> {
    throw new Error('Vehicle management is not implemented - vehicle info is stored in Driver.vehicleNumber')
  }

  /**
   * 차량 검색 (간단한 자동완성용)
   * TODO: Implement with proper Vehicle model
   */
  async searchVehicles(query: string, limit = 10): Promise<Pick<VehicleResponse, 'id' | 'plateNumber' | 'vehicleType' | 'ownership'>[]> {
    return []
  }

  /**
   * 차량 응답 포맷팅 (현재 사용되지 않음)
   * TODO: Implement when Vehicle model is added
   */
  private formatVehicleResponse(vehicle: any): VehicleResponse {
    throw new Error('Vehicle management is not implemented')
  }
}