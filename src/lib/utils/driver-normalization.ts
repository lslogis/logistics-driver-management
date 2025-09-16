/**
 * Driver normalization utilities for frontend forms
 */

export interface DriverSelection {
  id?: string | null
  name?: string | null
}

export interface NormalizedDriverData {
  driverId: string | null
  driverName: string
}

/**
 * Normalizes driver data for form submission
 * - If driver is selected from dropdown: returns { driverId: uuid, driverName: name }
 * - If driver name is manually entered: returns { driverId: null, driverName: text }
 * - If both are empty: returns { driverId: null, driverName: '' } (server will set to '용차')
 */
export function normalizeDriverForSubmit(
  selection?: DriverSelection | null
): NormalizedDriverData {
  const id = selection?.id && String(selection.id).trim()
  const name = selection?.name && String(selection.name).trim()
  
  // Clean up empty/null values
  const cleanId = id && id !== '__none__' && id.toLowerCase() !== 'null' ? id : null
  const cleanName = name || ''
  
  return {
    driverId: cleanId,
    driverName: cleanName,
  }
}

/**
 * Normalizes driver ID field specifically for API calls
 * Converts empty strings, '__none__', 'null' to null
 */
export function normalizeDriverId(value?: string | null): string | null {
  if (!value) return null
  const trimmed = String(value).trim()
  if (trimmed === '' || trimmed === '__none__' || trimmed.toLowerCase() === 'null') {
    return null
  }
  return trimmed
}

/**
 * Validates if a driver selection is complete for required scenarios
 */
export function isDriverSelectionValid(
  selection?: DriverSelection | null,
  required: boolean = false
): boolean {
  if (!required) return true
  
  const normalized = normalizeDriverForSubmit(selection)
  return Boolean(normalized.driverId || normalized.driverName)
}

/**
 * Gets display name for driver selection
 * Priority: selected driver name > manual input > '용차' (fallback)
 */
export function getDriverDisplayName(selection?: DriverSelection | null): string {
  const normalized = normalizeDriverForSubmit(selection)
  return normalized.driverName || '용차'
}