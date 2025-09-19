/**
 * Color Theme Provider for Management Pages
 * Provides consistent color schemes across different management pages
 */

export interface ColorTheme {
  // Gradient backgrounds
  bgGradient: string
  bgGradientFrom: string 
  bgGradientTo: string
  
  // Primary colors
  primary: string
  primaryHover: string
  primaryText: string
  
  // Secondary colors  
  secondary: string
  secondaryHover: string
  secondaryText: string
  
  // Border colors
  border: string
  borderHover: string
  
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgCard: string
  
  // Icon background
  iconBg: string
  iconText: string
}

export const colorThemes: Record<string, ColorTheme> = {
  // 고정관리 (Fixed Routes) - Indigo/Violet
  'fixed-routes': {
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-violet-50',
    bgGradientFrom: 'from-indigo-50',
    bgGradientTo: 'to-violet-50',
    primary: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    primaryHover: 'hover:from-indigo-600 hover:to-violet-600',
    primaryText: 'text-indigo-600',
    secondary: 'bg-indigo-50',
    secondaryHover: 'hover:bg-indigo-100',
    secondaryText: 'text-indigo-700',
    border: 'border-indigo-200',
    borderHover: 'focus:border-indigo-400',
    bgPrimary: 'bg-indigo-50',
    bgSecondary: 'bg-violet-50',
    bgCard: 'bg-white',
    iconBg: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    iconText: 'text-white'
  },
  
  // 기사관리 (Drivers) - Blue/Cyan  
  'drivers': {
    bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    bgGradientFrom: 'from-blue-50',
    bgGradientTo: 'to-cyan-50',
    primary: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    primaryHover: 'hover:from-blue-600 hover:to-cyan-600',
    primaryText: 'text-blue-600',
    secondary: 'bg-blue-50',
    secondaryHover: 'hover:bg-blue-100',
    secondaryText: 'text-blue-700',
    border: 'border-blue-200',
    borderHover: 'focus:border-blue-400',
    bgPrimary: 'bg-blue-50',
    bgSecondary: 'bg-cyan-50',
    bgCard: 'bg-white',
    iconBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    iconText: 'text-white'
  },
  
  // 용차관리 (Vehicles) - Green/Emerald
  'vehicles': {
    bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50',
    bgGradientFrom: 'from-green-50',
    bgGradientTo: 'to-emerald-50',
    primary: 'bg-gradient-to-r from-green-500 to-emerald-500',
    primaryHover: 'hover:from-green-600 hover:to-emerald-600',
    primaryText: 'text-green-600',
    secondary: 'bg-green-50',
    secondaryHover: 'hover:bg-green-100',
    secondaryText: 'text-green-700',
    border: 'border-green-200',
    borderHover: 'focus:border-green-400',
    bgPrimary: 'bg-green-50',
    bgSecondary: 'bg-emerald-50',
    bgCard: 'bg-white',
    iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    iconText: 'text-white'
  },
  
  // 요율관리 (Rates) - Purple/Pink
  'rates': {
    bgGradient: 'bg-gradient-to-br from-purple-50 to-pink-50',
    bgGradientFrom: 'from-purple-50',
    bgGradientTo: 'to-pink-50',
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500',
    primaryHover: 'hover:from-purple-600 hover:to-pink-600',
    primaryText: 'text-purple-600',
    secondary: 'bg-purple-50',
    secondaryHover: 'hover:bg-purple-100',
    secondaryText: 'text-purple-700',
    border: 'border-purple-200',
    borderHover: 'focus:border-purple-400',
    bgPrimary: 'bg-purple-50',
    bgSecondary: 'bg-pink-50',
    bgCard: 'bg-white',
    iconBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    iconText: 'text-white'
  },
  
  // Default/Loading Points - Orange/Amber (existing)
  'loading-points': {
    bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-50',
    bgGradientFrom: 'from-orange-50',
    bgGradientTo: 'to-amber-50',
    primary: 'bg-gradient-to-r from-orange-500 to-amber-500',
    primaryHover: 'hover:from-orange-600 hover:to-amber-600',
    primaryText: 'text-orange-600',
    secondary: 'bg-orange-50',
    secondaryHover: 'hover:bg-orange-100',
    secondaryText: 'text-orange-700',
    border: 'border-orange-200',
    borderHover: 'focus:border-orange-400',
    bgPrimary: 'bg-orange-50',
    bgSecondary: 'bg-amber-50',
    bgCard: 'bg-white',
    iconBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
    iconText: 'text-white'
  }
}

export const getColorTheme = (themeKey: string): ColorTheme => {
  return colorThemes[themeKey] || colorThemes['loading-points']
}