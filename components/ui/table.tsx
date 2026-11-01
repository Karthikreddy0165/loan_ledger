import React, { forwardRef } from 'react';

export const Table = forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table ref={ref} className={`w-full caption-bottom text-xs text-left border-collapse ${className}`} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <thead ref={ref} className={`[&_tr]:border-b bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 ${className}`} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableFooter = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tfoot
      ref={ref}
      className={`border-t bg-slate-50/50 font-medium dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 ${className}`}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

export const TableRow = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 data-[state=selected]:bg-slate-100 ${className}`}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <th
      ref={ref}
      className={`h-9 px-3 text-left align-middle font-medium text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`px-3 py-2.5 align-middle text-xs text-slate-700 dark:text-slate-300 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

