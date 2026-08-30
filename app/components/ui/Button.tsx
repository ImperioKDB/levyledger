import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-uniben text-ink hover:opacity-90 disabled:opacity-40',
  secondary: 'border border-rule text-ghost hover:border-ledger hover:text-ledger',
  ghost: 'text-ghost hover:text-uniben',
  danger: 'bg-void text-ink hover:opacity-90 disabled:opacity-40',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-4 py-2.5 text-xs',
  lg: 'px-6 py-4 text-xs tracking-widest',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`
          font-data uppercase transition-all duration-150 active:scale-[0.98] 
          focus-visible:outline focus-visible:outline-1 focus-visible:outline-uniben focus-visible:outline-offset-2
          ${variants[variant]} 
          ${sizes[size]} 
          ${fullWidth ? 'w-full' : ''} 
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border border-current border-t-transparent animate-spin" />
            Processing...
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
