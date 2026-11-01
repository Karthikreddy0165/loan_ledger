import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors border';

  const variants: Record<string, string> = {
    default:
      'border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
    secondary:
      'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300',
    success:
      'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    warning:
      'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    destructive:
      'border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
    outline:
      'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-transparent',
  };

  return (
    <div className={`${baseStyles} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </div>
  );
}

