import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'favorable' | 'alert' | 'neutral' | 'brass';

const TONE_CLASSES: Record<BadgeTone, string> = {
  favorable: 'bg-favorable-soft text-favorable',
  alert: 'bg-alert-soft text-alert',
  neutral: 'bg-neutral-soft text-neutral',
  brass: 'bg-surface-2 text-brass',
};

/** Preenchimento sólido — como os selos de status da referência, que são
 * chapados em vez de esmaecidos. Texto branco em todos para o contraste
 * não depender do tom. */
const SOLID_TONE_CLASSES: Record<BadgeTone, string> = {
  favorable: 'bg-favorable text-white',
  alert: 'bg-alert text-white',
  neutral: 'bg-neutral text-white',
  brass: 'bg-brass text-white',
};

export function Badge({
  tone = 'neutral',
  solid = false,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; solid?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        solid ? SOLID_TONE_CLASSES[tone] : TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
