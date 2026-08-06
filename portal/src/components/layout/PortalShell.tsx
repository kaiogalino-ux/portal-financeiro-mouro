'use client';

import { Minimize2, Stamp } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePresentationMode } from '@/hooks/usePresentationMode';
import { formatDateTime } from '@/shared/format/date';
import type { RoleName } from '@/shared/types/rbac.types';
import type { Resource } from '@/shared/types/rbac.types';
import { Header } from './Header';
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

  return (
    <div className="flex h-screen">
      <Sidebar allowedResources={allowedResources} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={userName} role={role} lastSyncAt={lastSyncAt} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
