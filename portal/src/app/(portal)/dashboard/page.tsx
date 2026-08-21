import { CalendarDays, Lock, Share2, ShieldCheck, Target, TrendingDown } from 'lucide-react';
import { getKpi, getKpiPorMesVencimento } from '@/server/dashboard/kpis';
import {
  getFluxoCaixaRealizadoAnoVigente, getIndicadoresPrevisao, getPrincipaisCentrosCustoReceber,
  getPrincipaisCentrosCustoPagar, getResultadoPorCentroCusto,
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
    principaisCentrosCustoReceber,
    principaisCentrosCustoPagar,
    resultadoPorCentro,
    indicadoresPrevisao,
    quebrasMensais,
  ] = await Promise.all([
    listEmpresasLookup(),
    listCentrosCustoLookup(filters.empresaId),
    listCategoriasLookup(filters.empresaId),
    Promise.all(DASHBOARD_KPI_KEYS.map((key) => getKpi(key, filters))),
    getFluxoCaixaRealizadoAnoVigente(filters),
    getPrincipaisCentrosCustoReceber(filters),
    getPrincipaisCentrosCustoPagar(filters),
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
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] font-bold uppercase leading-[0.92] tracking-[-0.04em] text-ink min-[1600px]:text-[66px] lg:text-[54px]">
            Fluxo de caixa
            <br />
            <span className="text-brass">projetado</span>
          </h1>
          <p className="mt-2.5 text-[15px] text-muted min-[1600px]:text-[17px]">Visão estratégica para decisões inteligentes</p>
        </div>
        <Card className="flex items-center gap-3.5 px-5 py-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
            <CalendarDays size={24} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.03em] text-ink">Planejar hoje</p>
            <p className="mt-0.5 font-display text-[13px] font-bold uppercase tracking-[0.03em] text-brass">Transformar o amanhã.</p>
          </div>
        </Card>
      </div>
      <GlobalFilterBar filters={filters} empresas={empresas} centrosCusto={centrosCusto} categorias={categorias} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} result={kpi} filters={filters} porMes={quebraPorKpi.get(kpi.key)} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Fluxo de caixa <span className="ml-1 font-sans text-[10px] font-semibold tracking-[0.06em] text-muted">Realizado, ano vigente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fluxoCaixa.length ? <ComboBarLineChart data={fluxoCaixa} /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Saldo acumulado <span className="ml-1 font-sans text-[10px] font-semibold tracking-[0.06em] text-muted">Realizado, ano vigente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fluxoCaixa.length ? <AreaTrendChart data={fluxoCaixa} /> : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              Centros de custo <span className="ml-1 font-sans text-[10px] font-semibold tracking-[0.06em] text-muted">A receber</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {principaisCentrosCustoReceber.length ? <DonutChart data={principaisCentrosCustoReceber} tone="favorable" /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Centros de custo <span className="ml-1 font-sans text-[10px] font-semibold tracking-[0.06em] text-muted">A pagar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {principaisCentrosCustoPagar.length ? <DonutChart data={principaisCentrosCustoPagar} tone="alert" /> : <EmptyState />}
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

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Resultado por centro de custo <span className="ml-1 font-sans text-[10px] font-semibold tracking-[0.06em] text-muted">Realizado, ano vigente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultadoPorCentro.length ? (
              <ul className="grid grid-cols-1 gap-x-7 gap-y-2.5 lg:grid-cols-2 min-[1600px]:grid-cols-3">
                {resultadoPorCentro.map((item) => {
                  const largura = (Math.abs(item.resultado) / maiorResultadoAbsoluto) * 100;
                  const favoravel = item.resultado >= 0;
                  return (
                    <li key={item.nome} className="grid grid-cols-[1fr_auto] items-center gap-3 text-[13px]">
                      <div className="min-w-0">
                        <p className="mb-1 truncate text-muted" title={item.nome}>{item.nome}</p>
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

      <PrincipiosFaixa />
    </div>
  );
}

/**
 * Faixa de fechamento da referência: mensagem da marca sobre por que planejar
 * caixa. É texto institucional, não indicador — de propósito não tem número,
 * para ninguém confundir com um dado do ERP.
 */
const PRINCIPIOS = [
  { Icon: ShieldCheck, texto: 'Fluxo de caixa projetado não é sorte, é estratégia.', destaque: true },
  { Icon: Target, texto: 'Previsibilidade financeira' },
  { Icon: TrendingDown, texto: 'Redução de riscos' },
  { Icon: Share2, texto: 'Apoio na tomada de decisão' },
  { Icon: Lock, texto: 'Segurança para investir e crescer' },
];

function PrincipiosFaixa() {
  return (
    <Card className="mt-4 grid grid-cols-1 gap-y-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-y-0">
      {PRINCIPIOS.map(({ Icon, texto, destaque }, indice) => (
        <div
          key={texto}
          className={`flex items-center gap-3 px-1 xl:px-4 ${indice > 0 ? 'xl:border-l xl:border-border' : ''}`}
        >
          <Icon size={26} strokeWidth={1.6} className="shrink-0 text-brass" aria-hidden="true" />
          <p className={`text-[13px] leading-snug ${destaque ? 'font-semibold text-ink' : 'text-muted'}`}>{texto}</p>
        </div>
      ))}
    </Card>
  );
}
