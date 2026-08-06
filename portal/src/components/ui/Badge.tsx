import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'favorable' | 'alert' | 'neutral' | 'brass';

const TONE_CLASSES: Record<BadgeTone, string> = {
  favorable: 'bg-favorable-soft text-favorable',
  alert: 'bg-alert-soft text-alert',
  neutral: 'bg-neutral-soft text-neutral',
  brass: 'bg-surface-2 text-brass',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
