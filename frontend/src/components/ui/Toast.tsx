'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning';
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-background border-border',
      success: 'bg-green-50 border-green-200 text-green-900',
      error: 'bg-red-50 border-red-200 text-red-900',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto flex w-full max-w-md rounded-lg border p-4 shadow-lg',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Toast.displayName = 'Toast';

export { Toast };
