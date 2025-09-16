// Design System Tokens for Modern Modal Forms

export const designTokens = {
  // Modal Layout
  modal: {
    minWidth: '400px',
    maxWidth: '768px',
    borderRadius: '16px',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    backdropBlur: 'blur(8px)',
    padding: {
      header: '24px 32px 16px 32px',
      body: '16px 32px 24px 32px',
      footer: '16px 32px 24px 32px'
    }
  },

  // Typography Scale
  typography: {
    title: 'text-xl font-semibold text-gray-900',
    subtitle: 'text-sm text-gray-600',
    label: 'text-sm font-medium text-gray-700',
    labelRequired: 'text-sm font-medium text-gray-900',
    labelAuto: 'text-xs font-medium text-gray-500',
    input: 'text-sm text-gray-900',
    inputPlaceholder: 'text-sm text-gray-400',
    helper: 'text-xs text-gray-500',
    error: 'text-xs text-red-600'
  },

  // Color Palette
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },

  // Spacing Scale
  spacing: {
    fieldGap: '20px',
    labelInputGap: '6px',
    rowGap: '16px',
    sectionGap: '32px',
    iconLabelGap: '8px'
  },

  // Field States
  fieldStates: {
    default: {
      border: 'border-gray-300',
      background: 'bg-white',
      text: 'text-gray-900',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    },
    required: {
      border: 'border-gray-300',
      background: 'bg-white',
      text: 'text-gray-900',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      indicator: 'text-red-500'
    },
    auto: {
      border: 'border-gray-200',
      background: 'bg-gray-50',
      text: 'text-gray-600',
      focus: 'cursor-not-allowed'
    },
    error: {
      border: 'border-red-300',
      background: 'bg-red-50',
      text: 'text-gray-900',
      focus: 'focus:ring-2 focus:ring-red-500 focus:border-red-500'
    }
  },

  // Button Styles
  buttons: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 font-medium px-6 py-2.5 rounded-lg transition-colors duration-200'
  },

  // Animation
  animations: {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200'
  }
}

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}