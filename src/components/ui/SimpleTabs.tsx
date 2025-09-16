'use client'

import React, { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  defaultValue: string
  className?: string
  children: ReactNode
}

interface TabsListProps {
  className?: string
  children: ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: ReactNode
}

const TabsContext = React.createContext<{
  activeTab: string
  setActiveTab: (value: string) => void
} | null>(null)

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn(className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-background text-foreground shadow-sm" 
          : "hover:bg-muted/80",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  const { activeTab } = context
  const isActive = activeTab === value

  if (!isActive) return null

  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  )
}