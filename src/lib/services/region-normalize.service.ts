import { PrismaClient } from '@prisma/client'

/**
 * Region Normalization Service
 * Handles conversion of raw region text to normalized forms
 */
export class RegionNormalizeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Normalize a single region text
   */
  async normalizeRegion(rawText: string): Promise<string> {
    if (!rawText?.trim()) {
      return ''
    }

    const cleanText = rawText.trim()
    
    // First check if we have an existing alias
    const alias = await this.prisma.regionAlias.findFirst({
      where: { 
        rawText: {
          equals: cleanText,
          mode: 'insensitive'
        },
        isActive: true 
      }
    })

    if (alias) {
      return alias.normalizedText
    }

    // Apply normalization rules
    const normalized = this.applyNormalizationRules(cleanText)
    
    // Check if we have an alias for the normalized form
    const normalizedAlias = await this.prisma.regionAlias.findFirst({
      where: {
        normalizedText: {
          equals: normalized,
          mode: 'insensitive'
        },
        isActive: true
      }
    })

    return normalizedAlias?.normalizedText || normalized
  }

  /**
   * Normalize multiple regions
   */
  async normalizeRegions(rawTexts: string[]): Promise<string[]> {
    const results = await Promise.all(
      rawTexts.map(text => this.normalizeRegion(text))
    )
    return results.filter(Boolean) // Remove empty strings
  }

  /**
   * Get both raw and normalized regions
   */
  async getRegionMapping(rawTexts: string[]): Promise<Array<{ raw: string, normalized: string }>> {
    const mappings = await Promise.all(
      rawTexts.map(async (raw) => ({
        raw,
        normalized: await this.normalizeRegion(raw)
      }))
    )
    return mappings.filter(m => m.raw.trim()) // Remove empty inputs
  }

  /**
   * Add a new region alias
   */
  async addRegionAlias(rawText: string, normalizedText: string): Promise<void> {
    await this.prisma.regionAlias.upsert({
      where: { rawText: rawText.trim() },
      create: {
        rawText: rawText.trim(),
        normalizedText: normalizedText.trim(),
        isActive: true
      },
      update: {
        normalizedText: normalizedText.trim(),
        isActive: true,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Apply built-in normalization rules
   */
  private applyNormalizationRules(text: string): string {
    let normalized = text.trim()

    // Remove common suffixes
    const suffixes = ['구', '시', '군', '동', '면', '읍', '리']
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix) && normalized.length > suffix.length) {
        normalized = normalized.slice(0, -suffix.length)
        break // Only remove one suffix
      }
    }

    // Handle English variants
    const englishMappings: Record<string, string> = {
      'gangnam': '강남',
      'suwon': '수원',
      'incheon': '인천',
      'busan': '부산',
      'daegu': '대구',
      'gwangju': '광주',
      'daejeon': '대전',
      'ulsan': '울산',
      'sejong': '세종',
      'gyeonggi': '경기',
      'jeju': '제주'
    }

    const lowerText = normalized.toLowerCase()
    if (englishMappings[lowerText]) {
      return englishMappings[lowerText]
    }

    // Handle common abbreviations
    const abbreviationMappings: Record<string, string> = {
      '경기': '경기',
      '서울': '서울',
      '부산': '부산',
      '대구': '대구',
      '인천': '인천',
      '광주': '광주',
      '대전': '대전',
      '울산': '울산',
      '세종': '세종',
      '제주': '제주'
    }

    return abbreviationMappings[normalized] || normalized
  }

  /**
   * Initialize common region aliases
   */
  async initializeCommonAliases(): Promise<void> {
    const commonAliases = [
      { raw: '강남구', normalized: '강남' },
      { raw: 'GANGNAM', normalized: '강남' },
      { raw: '수원시', normalized: '수원' },
      { raw: 'SUWON', normalized: '수원' },
      { raw: '인천시', normalized: '인천' },
      { raw: 'INCHEON', normalized: '인천' },
      { raw: '부산시', normalized: '부산' },
      { raw: 'BUSAN', normalized: '부산' },
      { raw: '서초구', normalized: '서초' },
      { raw: '송파구', normalized: '송파' },
      { raw: '영등포구', normalized: '영등포' },
      { raw: '마포구', normalized: '마포' },
      { raw: '용산구', normalized: '용산' },
      { raw: '성남시', normalized: '성남' },
      { raw: '고양시', normalized: '고양' },
      { raw: '안양시', normalized: '안양' },
      { raw: '광명시', normalized: '광명' }
    ]

    for (const alias of commonAliases) {
      await this.addRegionAlias(alias.raw, alias.normalized)
    }
  }

  /**
   * Get normalization statistics
   */
  async getStats(): Promise<{
    totalAliases: number
    activeAliases: number
    uniqueNormalizedRegions: number
  }> {
    const [totalAliases, activeAliases, uniqueNormalized] = await Promise.all([
      this.prisma.regionAlias.count(),
      this.prisma.regionAlias.count({ where: { isActive: true } }),
      this.prisma.regionAlias.groupBy({
        by: ['normalizedText'],
        where: { isActive: true }
      })
    ])

    return {
      totalAliases,
      activeAliases,
      uniqueNormalizedRegions: uniqueNormalized.length
    }
  }
}