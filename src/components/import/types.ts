import { ImportResult } from '@/lib/api/imports'

// 임포트 가능한 데이터 타입
export type ImportType = 'drivers' | 'loading-points' | 'fixed-contracts' | 'vehicles' | 'routes' | 'trips' | 'center-fares'

// 모달 단계
export type ImportStep = 'upload' | 'validate' | 'import' | 'complete'

// 각 타입별 설정
export interface ImportTypeConfig {
  title: string
  description: string
  templateFileName: string
  acceptedFileTypes: string[]
  maxFileSize: number // MB
  sampleFields: string[]
  icon: 'users' | 'map-pin' | 'route' | 'truck' | 'navigation' | 'calendar'
}

// 임포트 상태
export interface ImportState {
  step: ImportStep
  file: File | null
  results: ImportResult | null
  error: string | null
  isLoading: boolean
  uploadProgress: number
}

// 모달 props
export interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  type: ImportType
  onSuccess?: () => void
}

// 파일 드롭존 props
export interface FileDropZoneProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string[]
  maxSize?: number
  disabled?: boolean
  isLoading?: boolean
  progress?: number
  error?: string | null
}

// 각 타입별 설정 정의
export const IMPORT_TYPE_CONFIGS: Record<ImportType, ImportTypeConfig> = {
  drivers: {
    title: '기사 가져오기',
    description: 'CSV 또는 Excel 파일로 기사 정보를 일괄 등록할 수 있습니다.',
    templateFileName: '기사등록템플릿.csv',
    acceptedFileTypes: ['.csv', '.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['이름', '전화번호', '차량번호', '회사명', '은행명', '계좌번호'],
    icon: 'users'
  },
  'loading-points': {
    title: '상차지 가져오기',
    description: 'CSV 또는 Excel 파일로 상차지 정보를 일괄 등록할 수 있습니다.',
    templateFileName: '상차지등록템플릿.csv',
    acceptedFileTypes: ['.csv', '.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['상차지명', '주소', '연락처', '담당자', '특이사항'],
    icon: 'map-pin'
  },
  'fixed-contracts': {
    title: '고정계약 가져오기',
    description: 'CSV 또는 Excel 파일로 고정계약 정보를 일괄 등록할 수 있습니다.',
    templateFileName: '고정계약등록템플릿.csv',
    acceptedFileTypes: ['.csv', '.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['노선명', '계약형태', '기사명', '상차지명', '운행요일', '매출'],
    icon: 'route'
  },
  vehicles: {
    title: '차량 가져오기',
    description: 'CSV 또는 Excel 파일로 차량 정보를 일괄 등록할 수 있습니다.',
    templateFileName: '차량등록템플릿.csv',
    acceptedFileTypes: ['.csv', '.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['차량번호', '차량종류', '소유구분', '연식', '배정기사'],
    icon: 'truck'
  },
  routes: {
    title: '노선템플릿 가져오기',
    description: 'CSV 또는 Excel 파일로 노선템플릿을 일괄 등록할 수 있습니다.',
    templateFileName: '노선템플릿등록템플릿.csv',
    acceptedFileTypes: ['.csv', '.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['노선명', '출발지', '도착지', '거리', '기본요금'],
    icon: 'navigation'
  },
  trips: {
    title: '용차 가져오기',
    description: 'Excel 파일로 용차 정보를 일괄 등록할 수 있습니다.',
    templateFileName: '용차등록템플릿.xlsx',
    acceptedFileTypes: ['.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['날짜', '기사명', '차량번호', '노선명', '상태', '기사요금', '청구요금'],
    icon: 'calendar'
  },
  'center-fares': {
    title: '센터요율 가져오기',
    description: 'Excel 파일로 센터요율 정보를 일괄 등록할 수 있습니다.',
    templateFileName: '센터요율등록템플릿.xlsx',
    acceptedFileTypes: ['.xlsx', '.xls'],
    maxFileSize: 10,
    sampleFields: ['센터명', '차량톤수', '지역', '요율종류', '기본운임', '경유운임', '지역운임'],
    icon: 'navigation'
  }
}

// 가져오기 가능한 타입인지 확인
export function isValidImportType(type: string): type is ImportType {
  return Object.keys(IMPORT_TYPE_CONFIGS).includes(type)
}

// 타입별 설정 가져오기
export function getImportTypeConfig(type: ImportType): ImportTypeConfig {
  return IMPORT_TYPE_CONFIGS[type]
}