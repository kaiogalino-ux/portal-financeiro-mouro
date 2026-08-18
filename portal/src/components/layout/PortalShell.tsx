'use client';

import { Menu, Minimize2, Stamp, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { MouroMark } from '@/components/brand/MouroMark';
import { usePresentationMode } from '@/hooks/usePresentationMode';
import { formatDateTime } from '@/shared/format/date';
import type { RoleName } from '@/shared/types/rbac.types';
import type { Resource } from '@/shared/types/rbac.types';
import { Sidebar } from './Sidebar';

interface PortalShellProps {
  userName: string;
  role: RoleName;
  lastSyncAt: string | null;
  allowedResources: Resource[];
  children: ReactNode;
}

export function PortalShell({ userName, role, lastSyncAt, allowedResources, children }: PortalShellProps) {
  const presentation = usePresentationMode();
  const [menuAberto, setMenuAberto] = useState(false);

  if (presentation.active) {
    return (
      <div data-presentation="true" className="flex h-screen flex-col bg-bg">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <p className="font-display text-xl text-ink">Mouro Soluções — Portal Financeiro</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-muted">
              <Stamp size={16} className="text-brass" />
              {lastSyncAt ? `Atualizado em ${formatDateTime(lastSyncAt)}` : 'Ainda não sincronizado'}
            </span>
            <button
              type="button"
              onClick={() => presentation.toggle()}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-ink"
            >
              <Minimize2 size={16} />
              Sair da apresentação
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    );
  }

  const sidebar = (
    <Sidebar
      allowedResources={allowedResources}
      userName={userName}
      role={role}
      lastSyncAt={lastSyncAt}
      onNavigate={() => setMenuAberto(false)}
    />
  );

  return (
    <div className="flex h-screen bg-bg">
      <div className="hidden h-full lg:block">{sidebar}</div>

      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{sidebar}</div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute left-[248px] top-3 flex h-11 w-11 items-center justify-center rounded-lg bg-surface text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-bg px-4 py-2.5 lg:hidden">
          <span className="flex items-center gap-2.5">
            <MouroMark size={28} tema="auto" />
            <span className="font-display text-sm font-bold uppercase leading-none tracking-[0.04em] text-ink">
              Mouro
              <span className="mt-0.5 block text-[9px] tracking-[0.28em] text-brass">Soluções</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu de navegação"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-ink"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-7 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
