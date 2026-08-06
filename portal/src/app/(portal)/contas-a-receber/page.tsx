import { z } from 'zod';
import { listContasAReceber } from '@/server/data-access/titulos.repo';
import { listCategoriasLookup, listCentrosCustoLookup, listEmpresasLookup } from '@/server/data-access/lookups.repo';
import { dashboardFiltersSchema } from '@/shared/schemas/dashboard.schema';
import { TitulosListView } from '@/components/dashboard/TitulosListView';

const pageSchema = z.coerce.number().int().min(1).default(1);

export default async function ContasAReceberPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = dashboardFiltersSchema.parse(rawParams);
  const page = pageSchema.parse(rawParams.page);

  const [empresas, centrosCusto, categorias, resultado] = await Promise.all([
    listEmpresasLookup(),
    listCentrosCustoLookup(filters.empresaId),
    listCategoriasLookup(filters.empresaId),
    listContasAReceber(filters, { page, pageSize: 25 }),
  ]);

  return (
    <TitulosListView
      titulo="Contas a Receber"
      filters={filters}
      empresas={empresas}
      centrosCusto={centrosCusto}
      categorias={categorias}
      resultado={resultado}
    />
  );
}
