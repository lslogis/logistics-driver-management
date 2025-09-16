
'use client'

import * as React from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AdminLayout({ 
  children, 
  title,
  subtitle 
}: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "relative z-50 md:z-auto",
        "md:translate-x-0 transition-transform duration-300 ease-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <AdminSidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        {/* Header */}
        <AdminHeader 
          onToggleSidebar={toggleMobileMenu}
          title={title}
          subtitle={subtitle}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
          
          {/* Content Container - Maximized width */}
          <div className="relative z-10 min-h-full w-full">
            <div className="w-full min-h-full">
              {/* Page Animation Container */}
              <div className="animate-fade-in w-full">
                {children}
              </div>
            </div>
          </div>

          {/* Scroll to Top Button */}
          <ScrollToTopButton />
        </main>
      </div>
    </div>
  )
}

// Scroll to Top Button Component
function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-8 right-8 z-50",
        "p-3 bg-brand-600 hover:bg-brand-700 text-white",
        "rounded-full shadow-lg hover:shadow-xl",
        "transition-all duration-200 hover:scale-110",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
        "animate-bounce-subtle"
      )}
      aria-label="Scroll to top"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  )
}