import { useState, useRef, useEffect, forwardRef } from 'react'
import React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  error?: boolean
}

function mergeRefs<T>(...refs: (React.Ref<T> | null | undefined)[]) {
  return (node: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<T>).current = node
    })
  }
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, value, defaultValue, onChange, onBlur, disabled, name }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [internalValue, setInternalValue] = useState<string>(
      defaultValue != null ? String(defaultValue) : ''
    )
    const containerRef = useRef<HTMLDivElement>(null)
    const hiddenRef = useRef<HTMLSelectElement>(null)

    const options = React.Children.toArray(children)
      .filter((c): c is React.ReactElement => React.isValidElement(c))
      .map(opt => {
        const el = opt as React.ReactElement<{ value?: unknown; children?: React.ReactNode; disabled?: boolean }>
        return {
          value: el.props.value != null ? String(el.props.value) : '',
          label: String(el.props.children ?? el.props.value ?? ''),
          disabled: Boolean(el.props.disabled),
        }
      })

    const controlled = value !== undefined
    const currentValue = controlled ? String(value) : internalValue
    const currentLabel = options.find(o => o.value === currentValue)?.label ?? ''

    // Close when clicking outside
    useEffect(() => {
      if (!isOpen) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
          if (onBlur) onBlur({ target: hiddenRef.current } as any)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [isOpen, onBlur])

    const handleSelect = (optValue: string) => {
      if (!controlled) setInternalValue(optValue)
      if (hiddenRef.current) hiddenRef.current.value = optValue
      if (onChange) onChange({ target: hiddenRef.current } as React.ChangeEvent<HTMLSelectElement>)
      setIsOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { setIsOpen(false) }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(v => !v) }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const idx = options.findIndex(o => o.value === currentValue)
        const next = options.slice(idx + 1).find(o => !o.disabled)
        if (next) handleSelect(next.value)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const idx = options.findIndex(o => o.value === currentValue)
        const prev = [...options.slice(0, idx)].reverse().find(o => !o.disabled)
        if (prev) handleSelect(prev.value)
      }
    }

    return (
      <div ref={containerRef} className="relative">
        {/* Hidden native select keeps RHF ref + form submission working */}
        <select
          ref={mergeRefs(hiddenRef, ref)}
          name={name}
          value={currentValue}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {children}
        </select>

        {/* Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(v => !v)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'px-4 py-3 rounded-xl border text-sm font-medium text-left',
            'bg-white text-slate-900 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-300 ring-2 ring-red-200 focus:ring-red-300'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-50',
            className,
          )}
        >
          <span className={cn('truncate flex-1', !currentValue && 'text-slate-400')}>
            {currentLabel || 'Select…'}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        {/* Options panel */}
        {isOpen && !disabled && (
          <div className="absolute z-50 min-w-full mt-1.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                  opt.value === currentValue
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50',
                  opt.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <span>{opt.label}</span>
                {opt.value === currentValue && (
                  <Check className="w-4 h-4 text-brand-600 shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
