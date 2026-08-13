import { NextResponse } from 'next/server';
import { getKpi, getKpiDetalhe } from '@/server/dashboard/kpis';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parseFilters, parsePagination, queryParams } from '@/server/integracoes/apiHelpers';
import { kpiKeySchema } from '@/shared/schemas/dashboard.schema';
import { KPI_HELP, KPI_LABELS } from '@/shared/types/dashboard.types';

/**
 * Um indicador específico. Com `?detalhe=true`, devolve junto a lista de
 * títulos que compõem o número — a mesma consulta do drill-down da tela,
 * então o total sempre bate com a soma da lista.
 */
export const GET = withApiKey<{ params: Promise<{ indicador: string }> }>(async (request, { params }) => {
  const { indicador } = await params;
  const key = kpiKeySchema.parse(indicador);
  const filters = parseFilters(request);
  const kpi = await getKpi(key, filters);

  const querDetalhe = queryParams(request).detalhe === 'true';
  const detalhe = querDetalhe ? await getKpiDetalhe(key, filters, parsePagination(request)) : null;

  return NextResponse.json({
    chave: kpi.key,
    label: KPI_LABELS[kpi.key],
    descricao: KPI_HELP[kpi.key],
    valor: kpi.valor,
    comparacaoMesAnterior: kpi.comparacaoMesAnterior,
    comparacaoAnoAnterior: kpi.comparacaoAnoAnterior,
    dadosSimulados: kpi.isSimulated,
    filtros: filters,
    ...(detalhe ? { detalhe } : {}),
  });
});
