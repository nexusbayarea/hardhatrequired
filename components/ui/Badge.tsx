const variants = {
  default: 'bg-surface2 text-muted border-border',
  red: 'bg-red/10 text-red border-red/20',
  green: 'bg-green/10 text-green border-green/20',
  yellow: 'bg-yellow/10 text-yellow border-yellow/20',
  blue: 'bg-blue/10 text-blue border-blue/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
