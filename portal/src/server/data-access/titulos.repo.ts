import { prisma } from '@/server/db/prisma';
import { getIsDataSimulated } from '@/server/dashboard/dataProvenance';
import { buildTituloWhere } from '@/server/dashboard/filters';
import { mapTituloToDrilldownRow, TITULO_DRILLDOWN_INCLUDE } from '@/server/dashboard/mapDrilldown';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import type { Pagination } from '@/shared/schemas/common.schema';
import type { TituloTipo } from '@/generated/prisma';
import { withAuthz } from './withAuthz';

async function listTitulosByTipo(tipo: TituloTipo, filters: DashboardFilters, pagination: Pagination) {
  const where = { ...buildTituloWhere(filters, { tipo, aplicarPeriodo: true }) };
  const [titulos, total, isSimulated] = await Promise.all([
    prisma.titulo.findMany({
      where,
      include: TITULO_DRILLDOWN_INCLUDE,
      orderBy: { dataVencimento: 'asc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.titulo.count({ where }),
    getIsDataSimulated(),
  ]);

  return {
    rows: titulos.map(mapTituloToDrilldownRow),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    isSimulated,
  };
}

export const listContasAPagar = withAuthz(
  'contasAPagar',
  'read',
  (_session, filters: DashboardFilters, pagination: Pagination) =>
    listTitulosByTipo('PAGAR', filters, pagination),
);

export const listContasAReceber = withAuthz(
  'contasAReceber',
  'read',
  (_session, filters: DashboardFilters, pagination: Pagination) =>
    listTitulosByTipo('RECEBER', filters, pagination),
);
