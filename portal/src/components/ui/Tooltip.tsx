'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={200}>{children}</RadixTooltip.Provider>;
}

export function InfoTooltip({ label }: { label: string }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brass rounded-full"
        >
          <Info size={14} />
        </button>
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side="top"
          sideOffset={6}
          className="max-w-64 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-ink shadow-lg"
        >
          {label}
          <RadixTooltip.Arrow className="fill-surface-2" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
