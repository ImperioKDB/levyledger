import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="font-data text-ghost text-xs block uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full bg-paper border text-ledger font-data text-sm px-3 py-3 
            outline-none transition-colors placeholder:text-ghost/50
            ${error ? 'border-void focus:border-void' : 'border-rule focus:border-uniben'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="font-data text-void text-[10px] mt-1" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="font-data text-ghost text-[10px] mt-1">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
