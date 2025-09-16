'use client'

import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { designTokens, cn } from '@/styles/design-tokens'

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio'
export type FieldState = 'default' | 'required' | 'auto' | 'error'

interface FormRowProps {
  label: string
  name: string
  type?: FieldType
  state?: FieldState
  icon?: LucideIcon
  placeholder?: string
  value?: string | number | boolean
  options?: Array<{ value: string; label: string }>
  error?: string
  helper?: string
  rows?: number
  children?: ReactNode
  onChange?: (value: any) => void
  onBlur?: () => void
  className?: string
  disabled?: boolean
  autoComplete?: string
}

export default function FormRow({
  label,
  name,
  type = 'text',
  state = 'default',
  icon: Icon,
  placeholder,
  value,
  options,
  error,
  helper,
  rows = 3,
  children,
  onChange,
  onBlur,
  className,
  disabled,
  autoComplete
}: FormRowProps) {
  const fieldState = error ? 'error' : state
  const isAuto = state === 'auto'
  const isRequired = state === 'required'
  
  const inputClasses = cn(
    'w-full px-3 py-2.5 rounded-lg border transition-all duration-200',
    designTokens.fieldStates[fieldState].border,
    designTokens.fieldStates[fieldState].background,
    designTokens.fieldStates[fieldState].text,
    designTokens.fieldStates[fieldState].focus,
    designTokens.typography.input,
    disabled || isAuto ? 'cursor-not-allowed opacity-75' : 'cursor-text',
    className
  )

  const renderInput = () => {
    if (children) return children

    const commonProps = {
      id: name,
      name,
      value: typeof value === 'boolean' ? String(value) : (value || ''),
      onChange: (e: any) => onChange?.(e.target.value),
      onBlur,
      placeholder,
      disabled: disabled || isAuto,
      autoComplete,
      className: inputClasses
    }

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            className={cn(inputClasses, 'resize-none')}
          />
        )

      case 'select':
        return (
          <select {...commonProps} className={inputClasses}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              {...commonProps}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange?.(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={name} className="ml-2 text-sm text-gray-700">
              {placeholder}
            </label>
          </div>
        )

      default:
        return <input {...commonProps} type={type} />
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label with Icon and State Indicators */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className={cn(
            'h-4 w-4',
            fieldState === 'error' ? 'text-red-500' : 
            isAuto ? 'text-gray-400' : 'text-gray-600'
          )} />
        )}
        <label
          htmlFor={name}
          className={cn(
            designTokens.typography[isRequired ? 'labelRequired' : 'label'],
            fieldState === 'error' && 'text-red-700'
          )}
        >
          {label}
          {isRequired && (
            <span className={cn('ml-1', designTokens.fieldStates.required.indicator)}>
              *
            </span>
          )}
          {isAuto && (
            <span className={cn('ml-1', designTokens.typography.labelAuto)}>
              (자동)
            </span>
          )}
        </label>
      </div>

      {/* Input Field */}
      <div className="relative">
        {renderInput()}
        
        {/* Auto field overlay indicator */}
        {isAuto && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helper || error) && (
        <div className="flex items-start gap-1">
          {error ? (
            <p className={designTokens.typography.error}>
              {error}
            </p>
          ) : helper ? (
            <p className={designTokens.typography.helper}>
              {helper}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}