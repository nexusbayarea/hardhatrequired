import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <select
        ref={ref}
        className={`h-10 px-3.5 bg-surface2 border border-border rounded-xl text-sm text-text focus:outline-none focus:border-red/50 focus:ring-1 focus:ring-red/20 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
);
Select.displayName = 'Select';

export default Select;
