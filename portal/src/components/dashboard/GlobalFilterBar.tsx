'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { cn } from '@/lib/cn';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';

interface Lookup {
  id: string;
  nome: string;
}

interface GlobalFilterBarProps {
  filters: DashboardFilters;
  empresas: Array<{ id: string; nomeFantasia: string | null; razaoSocial: string }>;
  centrosCusto: Lookup[];
  categorias: Lookup[];
}

/** Faixa fina: no desktop os rótulos ficam à esquerda do controle (não acima),
 * para a barra não roubar a altura que a referência dá aos cards e gráficos. */
const CONTROL = 'h-9 min-w-0 max-w-full rounded-md border border-border bg-surface-2 px-2.5 text-[13px] text-ink outline-none focus-visible:border-brass';

export function GlobalFilterBar({ filters, empresas, centrosCusto, categorias }: GlobalFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: keyof DashboardFilters, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleChange(key: keyof DashboardFilters) {
    return (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => updateParam(key, event.target.value);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border border-border bg-surface px-4 py-2.5">
      <Field label="De">
        <input type="date" defaultValue={filters.periodoInicio ?? ''} onChange={handleChange('periodoInicio')} className={CONTROL} />
      </Field>
      <Field label="Até">
        <input type="date" defaultValue={filters.periodoFim ?? ''} onChange={handleChange('periodoFim')} className={CONTROL} />
      </Field>
      <Field label="Empresa" className="w-full sm:w-auto">
        <select
          defaultValue={filters.empresaId ?? ''}
          onChange={handleChange('empresaId')}
          className={cn(CONTROL, 'w-full sm:w-32')}
        >
          <option value="">Todas</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nomeFantasia ?? empresa.razaoSocial}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Centro de custo" className="w-full sm:w-auto">
        <select
          defaultValue={filters.centroCustoId ?? ''}
          onChange={handleChange('centroCustoId')}
          className={cn(CONTROL, 'w-full sm:w-32')}
        >
          <option value="">Todos</option>
          {centrosCusto.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Categoria" className="w-full sm:w-auto">
        <select
          defaultValue={filters.categoriaId ?? ''}
          onChange={handleChange('categoriaId')}
          className={cn(CONTROL, 'w-full sm:w-32')}
        >
          <option value="">Todas</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Regime">
        <div className="flex h-9 rounded-md border border-border bg-surface-2 p-0.5 text-[13px]">
          {(['caixa', 'competencia'] as const).map((regime) => (
            <button
              key={regime}
              type="button"
              onClick={() => updateParam('regime', regime)}
              className={`rounded px-2.5 capitalize transition-colors ${
                filters.regime === regime ? 'bg-brass font-medium text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {regime}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('flex min-w-0 max-w-full items-center gap-2', className)}>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">{label}</span>
      {children}
    </label>
  );
}
