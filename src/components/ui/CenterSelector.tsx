'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface Center {
  id: number
  name: string
  location?: string | null
  isActive: boolean
}

interface CenterSelectorProps {
  value?: number
  onChange: (centerId: number) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function CenterSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "센터를 선택하세요",
  className
}: CenterSelectorProps) {
  const [open, setOpen] = useState(false)
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load centers on mount
  useEffect(() => {
    loadCenters()
  }, [])

  const loadCenters = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/centers?isActive=true&limit=100')
      
      if (!response.ok) {
        throw new Error('Failed to load centers')
      }
      
      const data = await response.json()
      setCenters(data.data || [])
    } catch (err) {
      console.error('Error loading centers:', err)
      setError('센터 목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const selectedCenter = centers.find(center => center.id === value)

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              "w-full justify-between",
              !selectedCenter && "text-muted-foreground"
            )}
          >
            {loading ? (
              "로딩 중..."
            ) : selectedCenter ? (
              <span className="flex items-center gap-2">
                <span>{selectedCenter.name}</span>
                {selectedCenter.location && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedCenter.location})
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="센터 검색..."
              className="h-9"
            />
            <CommandEmpty>
              {error ? error : "센터를 찾을 수 없습니다."}
            </CommandEmpty>
            <CommandGroup>
              {centers.map((center) => (
                <CommandItem
                  key={center.id}
                  value={`${center.name} ${center.location || ''}`}
                  onSelect={() => {
                    onChange(center.id)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{center.name}</span>
                    {center.location && (
                      <span className="text-xs text-muted-foreground">
                        {center.location}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === center.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {required && !value && (
        <p className="text-sm text-destructive mt-1">
          센터 선택은 필수입니다.
        </p>
      )}
    </div>
  )
}