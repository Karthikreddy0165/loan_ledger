import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants: Record<string, string> = {
      default:
        'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm rounded-lg',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80 rounded-lg',
      outline:
        'border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg',
      ghost:
        'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 shadow-sm rounded-lg',
      link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-2.5 text-xs rounded-md gap-1.5',
      default: 'h-9 px-4 text-xs rounded-lg gap-2',
      lg: 'h-10 px-5 text-sm rounded-lg gap-2.5',
      icon: 'h-8 w-8 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default
          } ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

