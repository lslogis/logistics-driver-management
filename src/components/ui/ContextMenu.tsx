'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  children: React.ReactNode
  className?: string
  disabled?: boolean
  asChild?: boolean
}

export function ContextMenu({ items, children, className, disabled, asChild }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // 화면 경계를 고려한 메뉴 위치 계산
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = 200 // 예상 메뉴 너비
    const menuHeight = items.length * 36 + 8 // 예상 메뉴 높이

    let x = e.clientX
    let y = e.clientY

    // 오른쪽 경계 검사
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 8
    }

    // 하단 경계 검사
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 8
    }

    setPosition({ x, y })
    setIsOpen(true)
  }

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return
    
    item.onClick()
    setIsOpen(false)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // 스크롤 방지
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  const handleChildContextMenu = (e: React.MouseEvent) => {
    if (disabled) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // 화면 경계를 고려한 메뉴 위치 계산
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = 200 // 예상 메뉴 너비
    const menuHeight = items.length * 36 + 8 // 예상 메뉴 높이

    let x = e.clientX
    let y = e.clientY

    // 오른쪽 경계 검사
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 8
    }

    // 하단 경계 검사
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 8
    }

    setPosition({ x, y })
    setIsOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    // asChild가 true일 때는 자식 요소에 직접 이벤트 핸들러를 추가
    const childWithHandler = React.cloneElement(children, {
      onContextMenu: handleChildContextMenu,
      className: cn(children.props.className, "select-none", className)
    } as any)

    return (
      <>
        {childWithHandler}
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <div 
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 컨텍스트 메뉴 */}
            <div
              ref={menuRef}
              className="fixed z-[9999] min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
              }}
            >
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  {item.divider && index > 0 && (
                    <hr className="my-1 border-gray-200" />
                  )}
                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                      "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                      item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                      item.destructive && "text-red-600 hover:bg-red-50"
                    )}
                  >
                    {item.icon && <span className="text-gray-500">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className={cn("select-none", className)}
      >
        {children}
      </div>

      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 컨텍스트 메뉴 */}
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {item.divider && index > 0 && (
                  <hr className="my-1 border-gray-200" />
                )}
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                    "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                    item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                    item.destructive && "text-red-600 hover:bg-red-50"
                  )}
                >
                  {item.icon && <span className="text-gray-500">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// 터치 지원을 위한 훅
export function useContextMenu() {
  const [isLongPress, setIsLongPress] = useState(false)
  const longPressTimeout = useRef<NodeJS.Timeout>()

  const handleTouchStart = (callback: () => void) => (e: React.TouchEvent) => {
    longPressTimeout.current = setTimeout(() => {
      setIsLongPress(true)
      callback()
      // 햅틱 피드백 (지원하는 디바이스에서)
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms 길게 누르기
  }

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
    }
    setIsLongPress(false)
  }

  const handleTouchMove = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
    }
  }

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
    },
    isLongPress
  }
}