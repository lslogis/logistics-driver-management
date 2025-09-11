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
  async validateDriversCSV(file: File): Promise<ImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('validateOnly', 'true')

    const response = await fetch('/api/import/drivers', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result
  }

  async importDriversCSV(file: File): Promise<ImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('validateOnly', 'false')

    const response = await fetch('/api/import/drivers', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result
  }

  async validateTripsCSV(file: File): Promise<ImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('validateOnly', 'true')

    const response = await fetch('/api/import/trips', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result
  }

  async importTripsCSV(file: File): Promise<ImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('validateOnly', 'false')

    const response = await fetch('/api/import/trips', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result
  }

  async downloadDriverTemplate(): Promise<Blob> {
    const response = await fetch('/api/templates/drivers')
    if (!response.ok) throw new Error('Failed to download template')
    return response.blob()
  }

  async downloadTripTemplate(): Promise<Blob> {
    const response = await fetch('/api/templates/trips')
    if (!response.ok) throw new Error('Failed to download template')
    return response.blob()
  }
}

export const importsAPI = new ImportsAPI()