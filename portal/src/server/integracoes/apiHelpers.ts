import type { NextRequest } from 'next/server';
import { listEmpresasLookup } from '@/server/data-access/lookups.repo';
import { paginationSchema } from '@/shared/schemas/common.schema';
import { dashboardFiltersSchema } from '@/shared/schemas/dashboard.schema';

export function queryParams(request: NextRequest): Record<string, string> {
  return Object.fromEntries(request.nextUrl.searchParams);
}

export function parsePagination(request: NextRequest) {
  return paginationSchema.parse(queryParams(request));
}

export function parseFilters(request: NextRequest) {
  return dashboardFiltersSchema.parse(queryParams(request));
}

/** A API aceita `empresaId` opcional; sem ele, opera sobre a primeira
 * empresa cadastrada (hoje há só uma — ver README). */
export async function resolveEmpresaId(explicito?: string): Promise<string> {
  if (explicito) return explicito;
  const empresas = await listEmpresasLookup();
  const primeira = empresas[0];
  if (!primeira) throw new Error('Nenhuma empresa cadastrada.');
  return primeira.id;
}
