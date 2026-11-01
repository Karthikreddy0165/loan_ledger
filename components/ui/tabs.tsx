'use client';

import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = '',
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (val: string) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleChange }}>
      <div className={`space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${isActive
          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');

  if (ctx.value !== value) return null;

  return <div className={`outline-none ${className}`}>{children}</div>;
}

