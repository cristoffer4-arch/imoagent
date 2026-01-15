/**
 * Badge Component - Distintivo para scores e status
 */

import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  pill?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  primary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  pill = false,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium',
        pill ? 'rounded-full' : 'rounded',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * ScoreBadge - Badge especializado para exibir scores
 */
interface ScoreBadgeProps {
  score: number;
  size?: BadgeSize;
  className?: string;
}

export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const variant: BadgeVariant = 
    score >= 80 ? 'success' :
    score >= 60 ? 'info' :
    score >= 40 ? 'warning' :
    'danger';

  return (
    <Badge variant={variant} size={size} className={className} pill>
      {score}%
    </Badge>
  );
}
