import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brass text-bg hover:bg-brass-soft',
  secondary: 'border border-border bg-surface-2 text-ink hover:border-brass/50',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
