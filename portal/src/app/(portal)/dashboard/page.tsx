import { getKpi, getKpiPorMesVencimento } from '@/server/dashboard/kpis';
import {
  getFluxoCaixaProjetado, getIndicadoresPrevisao, getPrincipaisClientes,
  getPrincipaisFornecedores, getResultadoPorCentroCusto,
} from '@/server/dashboard/series';
import { listCategoriasLookup, listCentrosCustoLookup, listEmpresasLookup } from '@/server/data-access/lookups.repo';
import { dashboardFiltersSchema } from '@/shared/schemas/dashboard.schema';
import type { KpiKey } from '@/shared/schemas/dashboard.schema';
import { GlobalFilterBar } from '@/components/dashboard/GlobalFilterBar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ComboBarLineChart } from '@/components/charts/ComboBarLineChart';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { IndicadoresPrevisaoPanel } from '@/components/dashboard/IndicadoresPrevisaoPanel';
import { formatBRL } from '@/shared/format/currency';
import { EmptyState } from '@/components/ui/States';

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Resumo executivo mostra só estes 4 — os demais KPIs (títulos vencidos,
 * faturamento do mês, realizado do período, saldo projetado) continuam
 * calculáveis via getKpi, só não aparecem aqui. */
const DASHBOARD_KPI_KEYS: KpiKey[] = ['recebidoAteHoje', 'gastoAteHoje', 'totalAReceber', 'totalAPagar'];

/** Cards que ganham a quebra por mês de vencimento embaixo do valor — só faz
 * sentido nos totais em aberto, que olham para vencimentos futuros; os
 * acumulados já são, por definição, o passado fechado. */
const KPI_KEYS_COM_QUEBRA_MENSAL: KpiKey[] = ['totalAReceber', 'totalAPagar'];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawParams = await searchParams;
  const filters = dashboardFiltersSchema.parse(rawParams);

  const [
    empresas,
    centrosCusto,
    categorias,
    kpis,
    fluxoCaixa,
    principaisClientes,
    principaisFornecedores,
    resultadoPorCentro,
    indicadoresPrevisao,
    quebrasMensais,
  ] = await Promise.all([
    listEmpresasLookup(),
    listCentrosCustoLookup(filters.empresaId),
    listCategoriasLookup(filters.empresaId),
    Promise.all(DASHBOARD_KPI_KEYS.map((key) => getKpi(key, filters))),
    getFluxoCaixaProjetado(filters),
    getPrincipaisClientes(filters),
    getPrincipaisFornecedores(filters),
    getResultadoPorCentroCusto(filters),
    getIndicadoresPrevisao(filters),
    Promise.all(
      KPI_KEYS_COM_QUEBRA_MENSAL.map(async (key) => [key, await getKpiPorMesVencimento(key, filters)] as const),
    ),
  ]);

  const quebraPorKpi = new Map(quebrasMensais);
  const maiorResultadoAbsoluto = Math.max(1, ...resultadoPorCentro.map((r) => Math.abs(r.resultado)));

  return (
    <div>
      <GlobalFilterBar filters={filters} empresas={empresas} centrosCusto={centrosCusto} categorias={categorias} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} result={kpi} filters={filters} porMes={quebraPorKpi.get(kpi.key)} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de caixa projetado (próximos meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ComboBarLineChart data={fluxoCaixa} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={fluxoCaixa} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Principais clientes (a receber)</CardTitle>
          </CardHeader>
          <CardContent>
            {principaisClientes.length ? <DonutChart data={principaisClientes} /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Principais fornecedores (a pagar)</CardTitle>
          </CardHeader>
          <CardContent>
            {principaisFornecedores.length ? <DonutChart data={principaisFornecedores} /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de previsão</CardTitle>
          </CardHeader>
          <CardContent>
            <IndicadoresPrevisaoPanel indicadores={indicadoresPrevisao} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <CardHeader>
            <CardTitle>Resultado por centro de custo (realizado no período)</CardTitle>
          </CardHeader>
          <CardContent>
            {resultadoPorCentro.length ? (
              <ul className="space-y-2">
                {resultadoPorCentro.map((item) => {
                  const largura = (Math.abs(item.resultado) / maiorResultadoAbsoluto) * 100;
                  const favoravel = item.resultado >= 0;
                  return (
                    <li key={item.nome} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                      <div>
                        <p className="mb-1 text-muted">{item.nome}</p>
                        <div className="h-1.5 rounded-full bg-surface-2">
                          <div
                            className={`h-1.5 rounded-full ${favoravel ? 'bg-favorable' : 'bg-alert'}`}
                            style={{ width: `${largura}%` }}
                          />
                        </div>
                      </div>
                      <span className={`font-mono-num ${favoravel ? 'text-favorable' : 'text-alert'}`}>
                        {formatBRL(item.resultado)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
