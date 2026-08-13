import { NextResponse } from 'next/server';
import { getKpi } from '@/server/dashboard/kpis';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parseFilters } from '@/server/integracoes/apiHelpers';
import { kpiKeySchema } from '@/shared/schemas/dashboard.schema';
import { KPI_HELP, KPI_LABELS } from '@/shared/types/dashboard.types';

/**
 * Todos os indicadores de uma vez. Cada item vai acompanhado de `label` e
 * `descricao` (a mesma regra que o tooltip mostra na tela) — quem consome
 * isto costuma ser um LLM, e o número sozinho, sem a regra que o define,
 * é convite a interpretação errada.
 */
export const GET = withApiKey(async (request) => {
  const filters = parseFilters(request);
  const kpis = await Promise.all(kpiKeySchema.options.map((key) => getKpi(key, filters)));

  return NextResponse.json({
    filtros: filters,
    kpis: kpis.map((kpi) => ({
      chave: kpi.key,
      label: KPI_LABELS[kpi.key],
      descricao: KPI_HELP[kpi.key],
      valor: kpi.valor,
      comparacaoMesAnterior: kpi.comparacaoMesAnterior,
      comparacaoAnoAnterior: kpi.comparacaoAnoAnterior,
      dadosSimulados: kpi.isSimulated,
    })),
  });
});
