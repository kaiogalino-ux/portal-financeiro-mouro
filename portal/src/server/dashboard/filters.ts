import type { Prisma, TituloTipo } from '@/generated/prisma';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import { parseCalendarDate } from '@/shared/format/date';

export interface BuildWhereOptions {
  tipo?: TituloTipo;
  /** Se true, aplica periodoInicio/periodoFim; algumas leituras (ex.: total
   * em aberto "hoje") ignoram período de propósito — ver kpis.ts. */
  aplicarPeriodo?: boolean;
  /** Sobrepõe o campo de data usado no filtro de período (padrão: decide pelo regime). */
  campoData?: 'dataVencimento' | 'dataCompetencia' | 'dataLiquidacao';
}

/**
 * Fonte única do "where" — reusado tanto pela agregação (valor do card)
 * quanto pelo drill-down (lista de registros), para o total nunca poder
 * divergir da soma da lista (ver plano: "Dashboard component architecture").
 */
export function buildTituloWhere(
  filters: DashboardFilters,
  options: BuildWhereOptions = {},
): Prisma.TituloWhereInput {
  const where: Prisma.TituloWhereInput = {};

  if (options.tipo) where.tipo = options.tipo;
  if (filters.empresaId) where.empresaId = filters.empresaId;
  if (filters.centroCustoId) where.centroCustoId = filters.centroCustoId;
  if (filters.clienteId) where.clienteId = filters.clienteId;
  if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
  if (filters.categoriaId) where.categoriaId = filters.categoriaId;

  if (options.aplicarPeriodo && (filters.periodoInicio || filters.periodoFim)) {
    const campo = options.campoData ?? (filters.regime === 'caixa' ? 'dataVencimento' : 'dataCompetencia');
    where[campo] = {
      ...(filters.periodoInicio ? { gte: parseCalendarDate(filters.periodoInicio) } : {}),
      ...(filters.periodoFim ? { lte: parseCalendarDate(filters.periodoFim) } : {}),
    };
  }

  return where;
}
