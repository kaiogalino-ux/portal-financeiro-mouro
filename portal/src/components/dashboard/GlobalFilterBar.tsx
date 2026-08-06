'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent } from 'react';
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
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
      <Field label="Período (de)">
        <input
          type="date"
          defaultValue={filters.periodoInicio ?? ''}
          onChange={handleChange('periodoInicio')}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-brass"
        />
      </Field>
      <Field label="Período (até)">
        <input
          type="date"
          defaultValue={filters.periodoFim ?? ''}
          onChange={handleChange('periodoFim')}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-brass"
        />
      </Field>
      <Field label="Empresa/CNPJ">
        <select
          defaultValue={filters.empresaId ?? ''}
          onChange={handleChange('empresaId')}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-brass"
        >
          <option value="">Todas</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nomeFantasia ?? empresa.razaoSocial}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Centro de custo">
        <select
          defaultValue={filters.centroCustoId ?? ''}
          onChange={handleChange('centroCustoId')}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-brass"
        >
          <option value="">Todos</option>
          {centrosCusto.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Categoria">
        <select
          defaultValue={filters.categoriaId ?? ''}
          onChange={handleChange('categoriaId')}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-brass"
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
        <div className="flex rounded-lg border border-border bg-surface-2 p-0.5 text-sm">
          {(['caixa', 'competencia'] as const).map((regime) => (
            <button
              key={regime}
              type="button"
              onClick={() => updateParam('regime', regime)}
              className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                filters.regime === regime ? 'bg-brass text-bg' : 'text-muted hover:text-ink'
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  );
}
