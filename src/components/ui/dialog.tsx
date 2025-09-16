import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 md:left-64 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 md:left-64 bg-black/50" 
        onClick={() => onOpenChange(false)} 
      />
      {children}
    </div>
  )
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Modal sizing defaults per spec: w-auto, min-w-[400px], max-w-lg
        // Also support long forms with internal scroll area
        "relative z-50 w-auto min-w-[400px] max-w-lg mx-4 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-hidden flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-6 border-b", className)}
      {...props}
    >
      {children}
    </div>
  )
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-slate-900", className)}
      {...props}
    >
      {children}
    </h2>
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-slate-500", className)}
      {...props}
    >
      {children}
    </p>
  )
)
DialogDescription.displayName = "DialogDescription"

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex justify-end gap-2 p-6 border-t bg-slate-50", className)}
      {...props}
    >
      {children}
    </div>
  )
)
DialogFooter.displayName = "DialogFooter"

const DialogClose: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }

// RegisterModal example — field array based renderer
import { Button } from "./button"
import { FormRow, FormFieldState } from "./input"

export type RegisterField = {
  id: string
  label: string
  required?: boolean
  type?: 'text' | 'number' | 'date' | 'tel' | 'email' | 'password' | 'textarea' | 'select'
  placeholder?: string
  className?: string
  state?: FormFieldState
  helpText?: string
  options?: { value: string; label: string }[]
}

export interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: RegisterField[]
  onSubmit: (values: Record<string, string>) => void
  submitLabel?: string
  initialValues?: Record<string, string | number>
}

export function RegisterModal({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  submitLabel = '등록',
  initialValues = {}
}: RegisterModalProps) {
  const [values, setValues] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const init: Record<string, string> = {}
    fields.forEach(f => {
      const v = initialValues[f.id]
      init[f.id] = v !== undefined && v !== null ? String(v) : ''
    })
    setValues(init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleChange = (id: string) => (e: React.ChangeEvent<any>) => {
    setValues(prev => ({ ...prev, [id]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  if (!isOpen) return null

  // Decide layout: textarea or explicit w-full spans full row
  const isFullRow = (f: RegisterField) => f.type === 'textarea' || /(^|\s)w-full(\s|$)/.test(f.className || '')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose onClick={onClose} />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.id} className={isFullRow(f) ? 'md:col-span-2' : ''}>
                  <FormRow
                    id={f.id}
                    label={f.label}
                    required={f.required}
                    type={f.type}
                    placeholder={f.placeholder}
                    className={f.className || (f.type === 'textarea' ? 'w-full' : undefined)}
                    state={f.state}
                    value={values[f.id]}
                    onChange={handleChange(f.id)}
                    options={f.options}
                    helpText={f.helpText}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>취소</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{submitLabel}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
