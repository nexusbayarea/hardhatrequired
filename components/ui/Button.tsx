import { forwardRef } from 'react';

const variants = {
  primary: 'bg-red text-white hover:bg-red/90 shadow-lg shadow-red/20',
  secondary: 'bg-surface2 text-text border border-border hover:bg-border',
  ghost: 'text-muted hover:text-text',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export default Button;
