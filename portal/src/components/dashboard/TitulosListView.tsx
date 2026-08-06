import Link from 'next/link';
import { GlobalFilterBar } from '@/components/dashboard/GlobalFilterBar';
import { DrilldownTable } from '@/components/dashboard/DrilldownTable';
import { Card, CardContent } from '@/components/ui/Card';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import type { DrilldownResult } from '@/shared/types/dashboard.types';

interface TitulosListViewProps {
  titulo: string;
  filters: DashboardFilters;
  empresas: Array<{ id: string; nomeFantasia: string | null; razaoSocial: string }>;
  centrosCusto: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string }>;
  resultado: DrilldownResult;
}

export function TitulosListView({ titulo, filters, empresas, centrosCusto, categorias, resultado }: TitulosListViewProps) {
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.pageSize));

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-ink">{titulo}</h1>
      <GlobalFilterBar filters={filters} empresas={empresas} centrosCusto={centrosCusto} categorias={categorias} />
      <Card>
        <CardContent>
          <DrilldownTable rows={resultado.rows} />
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>
              {resultado.total} registro{resultado.total === 1 ? '' : 's'} · página {resultado.page} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <PageLink filters={filters} page={resultado.page - 1} disabled={resultado.page <= 1} label="Anterior" />
              <PageLink
                filters={filters}
                page={resultado.page + 1}
                disabled={resultado.page >= totalPaginas}
                label="Próxima"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  label,
}: {
  filters: DashboardFilters;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="rounded border border-border px-2 py-1 opacity-40">{label}</span>;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set('page', String(page));
  return (
    <Link href={`?${params.toString()}`} className="rounded border border-border px-2 py-1 hover:border-brass/50">
      {label}
    </Link>
  );
}
