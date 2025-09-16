'use client'

import React, { ReactNode, useEffect } from 'react'
import { X, LucideIcon } from 'lucide-react'
import { designTokens, cn } from '@/styles/design-tokens'

interface ModernModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: LucideIcon
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

export default function ModernModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = 'md',
  className
}: ModernModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          className={cn(
            'relative w-full bg-white shadow-2xl transition-all',
            sizeClasses[size],
            'rounded-2xl',
            designTokens.animations.scaleIn,
            className
          )}
          style={{
            minWidth: designTokens.modal.minWidth,
            maxWidth: designTokens.modal.maxWidth,
            boxShadow: designTokens.modal.shadow
          }}
        >
          {/* Header */}
          <div
            className="border-b border-gray-100"
            style={{ padding: designTokens.modal.padding.header }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className={designTokens.typography.title}>
                    {title}
                  </h3>
                  {subtitle && (
                    <p className={cn(designTokens.typography.subtitle, 'mt-1')}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="max-h-[calc(90vh-200px)] overflow-y-auto"
            style={{ padding: designTokens.modal.padding.body }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="border-t border-gray-100 bg-gray-50 rounded-b-2xl"
              style={{ padding: designTokens.modal.padding.footer }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Modal Footer Component
interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  )
}

// Modal Button Components
interface ModalButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  form?: string
  className?: string
}

export function ModalButton({
  children,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  form,
  className
}: ModalButtonProps) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        designTokens.buttons[variant],
        loading && 'opacity-75 cursor-not-allowed',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
