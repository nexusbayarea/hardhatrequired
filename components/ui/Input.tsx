import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <input
        ref={ref}
        className={`h-10 px-3.5 bg-surface2 border border-border rounded-xl text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-red/50 focus:ring-1 focus:ring-red/20 transition-all ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  )
);
Input.displayName = 'Input';

export default Input;
