'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Maximize2, Stamp } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { usePresentationMode } from '@/hooks/usePresentationMode';
import { formatDateTime } from '@/shared/format/date';
import { ROLE_LABELS } from '@/shared/constants/roles';
import type { Resource, RoleName } from '@/shared/types/rbac.types';
import { MouroMark } from '@/components/brand/MouroMark';
import { NAV_ITEMS } from './navConfig';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  allowedResources: Resource[];
  userName: string;
  role: RoleName;
  lastSyncAt: string | null;
  /** Fecha o menu móvel após navegar — no desktop fica sem efeito. */
  onNavigate?: () => void;
}

export function Sidebar({ allowedResources, userName, role, lastSyncAt, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const presentation = usePresentationMode();
  const allowed = new Set(allowedResources);
  const items = NAV_ITEMS.filter((item) => allowed.has(item.resource));

  return (
    <aside className="mouro-sidebar flex h-full w-60 shrink-0 flex-col border-r">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <MouroMark size={40} />
        <div>
          <p className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.03em] text-white">Mouro</p>
          <p className="mt-1 font-display text-[10px] font-bold uppercase leading-none tracking-[0.3em] text-brass">Soluções</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Navegação principal">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors',
                active ? 'bg-white/[0.06] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white',
              )}
            >
              {active && <span className="absolute -left-3 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r bg-brass" aria-hidden="true" />}
              <Icon size={18} className={active ? 'text-brass' : 'text-white/45 transition-colors group-hover:text-white'} />
              <span className="flex-1">{item.label}</span>
              {item.emConstrucao && (
                <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/35">breve</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* A citação é parte da identidade da referência, mas em telas baixas ela
          rouba o espaço do menu — some abaixo de 900px de altura. */}
      <figure className="mx-4 mb-4 mt-4 hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 pb-3 pt-2 [@media(min-height:900px)]:block">
        <span aria-hidden="true" className="font-display text-2xl font-bold leading-none text-brass">“</span>
        <blockquote className="mt-0.5 text-[13px] leading-relaxed text-white/70">
          Empresas que planejam seu caixa, tomam decisões melhores e crescem com segurança.
        </blockquote>
        <span aria-hidden="true" className="block text-right font-display text-2xl font-bold leading-none text-brass">”</span>
      </figure>

      <p
        className="mx-4 mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-white/40"
        title="Selo de última sincronização — quando os dados foram atualizados pela última vez"
      >
        <Stamp size={13} className="mt-px shrink-0 text-brass" aria-hidden="true" />
        {lastSyncAt ? `Atualizado em ${formatDateTime(lastSyncAt)}` : 'Ainda não sincronizado'}
      </p>

      <div className="mx-4 mb-3 mt-2 flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => presentation.toggle()}
          aria-pressed={presentation.active}
          aria-label="Modo apresentação"
          title="Modo apresentação — texto maior para ler à distância"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-brass hover:text-white"
        >
          <Maximize2 size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mx-4 mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3.5">
        <MouroMark size={26} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[11px] font-bold uppercase tracking-[0.06em] text-white" title={userName}>
            {userName}
          </p>
          <p className="truncate text-[11px] text-white/50">{ROLE_LABELS[role]}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Sair da conta"
          title="Sair"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
