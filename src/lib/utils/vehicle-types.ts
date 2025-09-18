export interface VehicleTypeOption {
  id: string
  name: string
}

const baseVehicleTypeOptions: VehicleTypeOption[] = [
  { id: '1톤', name: '1톤' },
  { id: '1.4톤', name: '1.4톤' },
  { id: '2.5톤', name: '2.5톤' },
  { id: '3.5톤', name: '3.5톤' },
  { id: '3.5톤광폭', name: '3.5톤광폭' },
  { id: '5톤', name: '5톤' },
  { id: '5톤축', name: '5톤축' },
  { id: '8톤', name: '8톤' },
  { id: '11톤', name: '11톤' },
  { id: '14톤', name: '14톤' },
]

const sanitizeVehicleTypeValue = (value: string): string => {
  let sanitized = value
    .trim()
    .toLowerCase()
    .replace('﹒', '.')

  sanitized = sanitized
    .replace(/ton/g, '톤')
    .replace(/wide/g, '광폭')
    .replace(/와이드/g, '광폭')
    .replace(/axle/g, '축')
    .replace(/축차/g, '축')

  sanitized = sanitized
    .replace(/[\s_\-/]+/g, '')
    .replace(/(\d+)\.0톤/g, '$1톤')
    .replace(/(\d+)\.0(?=톤|광폭|축|$)/g, '$1')

  // convert leftover latin t designations (e.g. 3.5t, 5t)
  sanitized = sanitized.replace(/t/g, '톤')

  // collapse repeated markers that may appear after replacements
  sanitized = sanitized
    .replace(/톤톤/g, '톤')
    .replace(/톤광폭광폭/g, '톤광폭')
    .replace(/광폭폭/g, '광폭')
    .replace(/톤축축/g, '톤축')

  return sanitized
}

const lookup = new Map<string, string>()

const register = (raw: string, canonical: string) => {
  const key = sanitizeVehicleTypeValue(raw)
  if (key) lookup.set(key, canonical)
}

baseVehicleTypeOptions.forEach(option => {
  register(option.id, option.id)
  register(option.name, option.id)
})

// Additional aliases to align historical labels with canonical names
register('1.0톤', '1톤')
register('1ton', '1톤')
register('1t', '1톤')
register('1 ton', '1톤')
register('1.4ton', '1.4톤')
register('1.4t', '1.4톤')
register('2.5ton', '2.5톤')
register('2.5t', '2.5톤')
register('3.5ton', '3.5톤')
register('3.5 t', '3.5톤')
register('3.5t', '3.5톤')
register('5ton', '5톤')
register('5t', '5톤')
register('5.0톤', '5톤')
register('8ton', '8톤')
register('8t', '8톤')
register('11ton', '11톤')
register('11t', '11톤')
register('11.0톤', '11톤')
register('14ton', '14톤')
register('14t', '14톤')
register('14.0톤', '14톤')

register('3.5광', '3.5톤광폭')
register('3.5광폭', '3.5톤광폭')
register('3.5톤광', '3.5톤광폭')
register('3.5tonwide', '3.5톤광폭')
register('3.5 ton wide', '3.5톤광폭')
register('3.5ton wide', '3.5톤광폭')
register('3.5와이드', '3.5톤광폭')
register('3.5톤 와이드', '3.5톤광폭')
register('3.5wide', '3.5톤광폭')
register('3.5-ton wide', '3.5톤광폭')

register('5축', '5톤축')
register('5 ton axle', '5톤축')
register('5ton축', '5톤축')
register('5-ton axle', '5톤축')
register('5 ton-axle', '5톤축')
register('5t축', '5톤축')

export const VEHICLE_TYPE_OPTIONS = baseVehicleTypeOptions

export const normalizeVehicleTypeName = (input: string | null | undefined): string | undefined => {
  if (!input) return undefined
  const key = sanitizeVehicleTypeValue(input)
  if (!key) return undefined
  return lookup.get(key)
}
