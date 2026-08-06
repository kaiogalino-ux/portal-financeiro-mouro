'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './navConfig';
import type { Resource } from '@/shared/types/rbac.types';

export function Sidebar({ allowedResources }: { allowedResources: Resource[] }) {
  const pathname = usePathname();
  const allowed = new Set(allowedResources);
  const items = NAV_ITEMS.filter((item) => allowed.has(item.resource));

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-surface px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brass font-display text-sm font-bold text-bg">
          M
        </span>
        <div>
          <p className="font-display text-sm leading-tight text-ink">Mouro Soluções</p>
          <p className="text-xs leading-tight text-muted">Portal Financeiro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                active ? 'bg-surface-2 text-brass' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.emConstrucao && (
                <span className="rounded bg-neutral-soft px-1.5 py-0.5 text-[10px] text-neutral">em breve</span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink"
      >
        <LogOut size={16} />
        Sair
      </button>
    </aside>
  );
}
