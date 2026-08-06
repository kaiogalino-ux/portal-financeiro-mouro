'use client';

import { Maximize2, Stamp } from 'lucide-react';
import { usePresentationMode } from '@/hooks/usePresentationMode';
import { formatDateTime } from '@/shared/format/date';
import { ROLE_LABELS } from '@/shared/constants/roles';
import type { RoleName } from '@/shared/types/rbac.types';

interface HeaderProps {
  userName: string;
  role: RoleName;
  lastSyncAt: string | null;
}

export function Header({ userName, role, lastSyncAt }: HeaderProps) {
  const presentation = usePresentationMode();

  return (
    <header className="flex items-center justify-between border-b border-border bg-bg px-6 py-3">
      <div>
        <p className="font-display text-lg text-ink">Portal Financeiro</p>
        <p className="text-xs text-muted">{userName} · {ROLE_LABELS[role]}</p>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted"
          title="Selo de última sincronização — quando os dados foram atualizados pela última vez"
        >
          <Stamp size={14} className="text-brass" />
          {lastSyncAt ? `Atualizado em ${formatDateTime(lastSyncAt)}` : 'Ainda não sincronizado'}
        </div>

        <button
          type="button"
          onClick={() => presentation.toggle()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-ink"
          aria-pressed={presentation.active}
        >
          <Maximize2 size={14} />
          Modo apresentação
        </button>
      </div>
    </header>
  );
}
