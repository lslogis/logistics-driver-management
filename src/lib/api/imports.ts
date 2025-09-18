// Import 결과 타입 정의
export interface ImportResult {
  total: number
  valid: number
  invalid: number
  imported: number
  errors: Array<{
    row: number
    error: string
    data?: any
  }>
  preview?: any[]
}

export interface ImportResponse {
  ok: boolean
  data: {
    message: string
    results: ImportResult
  }
  error?: {
    code: string
    message: string
  }
}

export class ImportsAPI {
  private async handleAPIResponse(response: Response): Promise<ImportResponse> {
    // Handle network errors
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('파일이 너무 큽니다. 10MB 이하의 파일을 선택해주세요.')
      }
      if (response.status === 415) {
        throw new Error('지원하지 않는 파일 형식입니다. CSV 파일만 업로드 가능합니다.')
      }
      if (response.status >= 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    }

    let result: ImportResponse
    try {
      result = await response.json()
    } catch (error) {
      throw new Error('서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.')
    }

    if (!result.ok) {
      const errorMessage = result.error?.message || '알 수 없는 오류가 발생했습니다.'
      throw new Error(errorMessage)
    }

    return result
  }

  async validateDriversCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'simulate')

      const response = await fetch('/api/import/drivers', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async importDriversCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'commit')

      const response = await fetch('/api/import/drivers', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async validateChartersCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'simulate')

      const response = await fetch('/api/import/charters', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async importChartersCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'commit')

      const response = await fetch('/api/import/charters', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async downloadDriverTemplate(): Promise<Blob> {
    try {
      const response = await fetch('/api/templates/drivers')
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('템플릿 파일을 찾을 수 없습니다.')
        }
        if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error('템플릿 다운로드에 실패했습니다.')
      }

      return response.blob()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async downloadCharterTemplate(): Promise<Blob> {
    try {
      const response = await fetch('/api/templates/charters')
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('템플릿 파일을 찾을 수 없습니다.')
        }
        if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error('템플릿 다운로드에 실패했습니다.')
      }

      return response.blob()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  // Vehicles Import/Export
  async validateVehiclesCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'simulate')

      const response = await fetch('/api/import/vehicles', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async importVehiclesCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'commit')

      const response = await fetch('/api/import/vehicles', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async downloadVehicleTemplate(): Promise<Blob> {
    try {
      const response = await fetch('/api/templates/vehicles')
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('템플릿 파일을 찾을 수 없습니다.')
        }
        if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error('템플릿 다운로드에 실패했습니다.')
      }

      return response.blob()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }


  // Export functionality
  private async handleExportResponse(response: Response, filename: string): Promise<void> {
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('데이터를 찾을 수 없습니다.')
      }
      if (response.status >= 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
      throw new Error('내보내기에 실패했습니다.')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async exportDrivers(format: 'excel' | 'csv' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/export/drivers?format=${format}`)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      const filename = `기사목록_${timestamp}.${extension}`
      
      await this.handleExportResponse(response, filename)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async exportVehicles(format: 'excel' | 'csv' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/export/vehicles?format=${format}`)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      const filename = `차량목록_${timestamp}.${extension}`
      
      await this.handleExportResponse(response, filename)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }


  async exportTrips(format: 'excel' | 'csv' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/export/trips?format=${format}`)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      const filename = `운행목록_${timestamp}.${extension}`
      
      await this.handleExportResponse(response, filename)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async exportSettlements(params?: { year?: number; month?: number; driverId?: string }): Promise<void> {
    try {
      const response = await fetch('/api/settlements/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {})
      })
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
      const filename = `정산내역_${timestamp}.xlsx`
      
      await this.handleExportResponse(response, filename)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  // Loading Points Import/Export
  async validateLoadingPointsCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'simulate')

      const response = await fetch('/api/import/loading-points', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async importLoadingPointsCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'commit')

      const response = await fetch('/api/import/loading-points', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async downloadLoadingPointTemplate(): Promise<Blob> {
    try {
      const response = await fetch('/api/templates/loading-points')
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('템플릿 파일을 찾을 수 없습니다.')
        }
        if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error('템플릿 다운로드에 실패했습니다.')
      }

      return response.blob()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async exportLoadingPoints(format: 'excel' | 'csv' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/loading-points/export?format=${format}`)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      const filename = `상차지목록_${timestamp}.${extension}`
      
      await this.handleExportResponse(response, filename)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  // Fixed Contracts Import/Export
  async validateFixedContractsCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'simulate')

      const response = await fetch('/api/import/fixed-contracts', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async importFixedContractsCSV(file: File): Promise<ImportResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'commit')

      const response = await fetch('/api/import/fixed-contracts', {
        method: 'POST',
        body: formData
      })

      return await this.handleAPIResponse(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async downloadFixedContractTemplate(): Promise<Blob> {
    try {
      const response = await fetch('/api/templates/fixed-contracts')
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('템플릿 파일을 찾을 수 없습니다.')
        }
        if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error('템플릿 다운로드에 실패했습니다.')
      }

      return response.blob()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }

  async exportFixedContracts(format: 'excel' | 'csv' = 'excel'): Promise<void> {
    try {
      const response = await fetch(`/api/fixed-contracts/export?format=${format}`)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      const filename = `고정계약목록_${timestamp}.${extension}`
      
      await this.handleExportResponse(response, filename)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.')
      }
      throw error
    }
  }
}

export const importsAPI = new ImportsAPI()