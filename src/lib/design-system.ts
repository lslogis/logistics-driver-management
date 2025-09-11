/**
 * Design System Constants for Logistics Management System
 * Unified design tokens and component specifications
 */

// Color Palette
export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Status Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
}

// Typography Scale
export const typography = {
  sizes: {
    'heading-1': 'text-3xl font-bold',
    'heading-2': 'text-2xl font-bold',
    'heading-3': 'text-lg font-semibold',
    'body-large': 'text-base font-medium',
    'body': 'text-sm font-normal',
    'body-small': 'text-xs font-normal',
    'caption': 'text-xs font-medium',
  }
}

// Spacing Scale (based on 4px unit)
export const spacing = {
  xs: 'space-x-2',  // 8px
  sm: 'space-x-3',  // 12px
  md: 'space-x-4',  // 16px
  lg: 'space-x-6',  // 24px
  xl: 'space-x-8',  // 32px
}

// Button Specifications
export const buttons = {
  // Button Variants
  variants: {
    primary: 'bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 focus:ring-gray-500',
    outline: 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    danger: 'bg-red-600 text-white border-transparent hover:bg-red-700 focus:ring-red-500',
  },
  
  // Button Sizes
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  },
  
  // Base button classes
  base: 'inline-flex items-center justify-center border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200',
  
  // Icon button classes
  icon: 'p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200',
}

// Card Specifications
export const cards = {
  base: 'bg-white rounded-lg shadow border border-gray-200',
  header: 'px-6 py-4 border-b border-gray-200',
  content: 'px-6 py-4',
  footer: 'px-6 py-4 border-t border-gray-200',
}

// Table Specifications
export const tables = {
  container: 'overflow-x-auto bg-white rounded-lg shadow border border-gray-200',
  table: 'min-w-full divide-y divide-gray-200',
  
  header: {
    row: 'bg-gray-50',
    cell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  },
  
  body: {
    row: 'hover:bg-gray-50 transition-colors duration-150',
    cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
    cellSecondary: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500',
  },
  
  actions: {
    container: 'flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
    button: 'p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    dangerButton: 'p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  }
}

// Form Specifications
export const forms = {
  input: 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
  select: 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
  textarea: 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-vertical',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  error: 'mt-1 text-sm text-red-600',
  helper: 'mt-1 text-sm text-gray-500',
}

// Badge Specifications
export const badges = {
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  variants: {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  }
}

// Modal Specifications
export const modals = {
  overlay: 'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40',
  container: 'fixed inset-0 z-50 overflow-y-auto',
  wrapper: 'flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0',
  panel: 'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle',
  
  sizes: {
    sm: 'sm:max-w-sm sm:w-full',
    md: 'sm:max-w-md sm:w-full',
    lg: 'sm:max-w-lg sm:w-full',
    xl: 'sm:max-w-xl sm:w-full',
    '2xl': 'sm:max-w-2xl sm:w-full',
    '4xl': 'sm:max-w-4xl sm:w-full',
  },
  
  header: 'px-6 py-4 border-b border-gray-200',
  content: 'px-6 py-4',
  footer: 'px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3',
}

// Layout Specifications
export const layout = {
  page: {
    container: 'min-h-screen bg-gray-50',
    content: 'w-full py-6 px-4',
  },
  
  header: {
    container: 'bg-white shadow border-b border-gray-200',
    content: 'w-full px-4',
    inner: 'flex items-center justify-between h-16',
    
    title: {
      container: 'flex items-center space-x-3',
      icon: 'h-8 w-8',
      text: 'text-3xl font-bold text-gray-900',
      subtitle: 'text-gray-600 mt-1',
    },
    
    actions: 'flex items-center space-x-3',
  },
  
  section: {
    container: 'mb-6',
    card: 'bg-white rounded-lg shadow border border-gray-200',
    header: 'px-6 py-4 border-b border-gray-200',
    content: 'p-6',
  }
}

// Utility Functions
export const cn = (...classes: (string | undefined | false | null)[]) => {
  return classes.filter(Boolean).join(' ')
}

export const getButtonClasses = (variant: keyof typeof buttons.variants = 'primary', size: keyof typeof buttons.sizes = 'md') => {
  return cn(buttons.base, buttons.variants[variant], buttons.sizes[size])
}

export const getIconButtonClasses = (variant: keyof typeof buttons.variants = 'ghost') => {
  return cn(buttons.icon, buttons.variants[variant])
}

export const getBadgeClasses = (variant: keyof typeof badges.variants = 'neutral') => {
  return cn(badges.base, badges.variants[variant])
}