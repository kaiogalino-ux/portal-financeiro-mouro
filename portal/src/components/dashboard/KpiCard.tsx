'use client';

import { useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, CalendarClock, Clock, Coins, Gauge, Landmark, Receipt, TrendingDown, TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { Sheet } from '@/components/ui/Sheet';
import { InlineErrorState, Skeleton } from '@/components/ui/States';
import { formatBRL } from '@/shared/format/currency';
import { formatMonthKeyLabel } from '@/shared/format/date';
import type { DashboardFilters, KpiKey } from '@/shared/schemas/dashboard.schema';
import type { DrilldownResult, KpiMesValor, KpiResult } from '@/shared/types/dashboard.types';
import { KPI_HELP, KPI_LABELS } from '@/shared/types/dashboard.types';
import { DrilldownTable } from './DrilldownTable';

/** Cards de valor negativo/vencido não são "favoráveis" por convenção — só
 * resultadoDoPeriodo e saldoProjetado ganham cor por sinal; os demais são neutros. */
const SIGNED_KEYS = new Set(['resultadoDoPeriodo', 'saldoProjetado']);
const ALERT_KEYS = new Set(['titulosVencidos']);

/** Ícone decorativo de cada card, no espírito da referência: seta pra dentro =
 * dinheiro que entra, seta pra fora = dinheiro que sai. */
const KPI_ICONS: Record<KpiKey, typeof TrendingUp> = {
  recebidoAteHoje: ArrowDownToLine,
  gastoAteHoje: ArrowUpFromLine,
  totalAReceber: Landmark,
  totalAPagar: Coins,
  titulosVencidos: Clock,
  faturamentoDoMes: Receipt,
  receitasRealizadas: TrendingUp,
  despesasRealizadas: TrendingDown,
  resultadoDoPeriodo: Gauge,
  saldoProjetado: CalendarClock,
};

/** O triângulo (▲/▼) já carrega o sinal — o número sai sem "+" para não duplicar. */
const percentAbs = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

function buildQuery(filters: DashboardFilters, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set('page', String(page));
  params.set('pageSize', '20');
  return params.toString();
}

export function KpiCard({
  result,
  filters,
  porMes,
}: {
  result: KpiResult;
  filters: DashboardFilters;
  /** Quebra do total por mês de vencimento — só os cards de "em aberto" recebem. */
  porMes?: KpiMesValor[];
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [detalhe, setDetalhe] = useState<DrilldownResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  async function carregarDetalhe(paginaAlvo: number) {
    setLoading(true);
    setErro(false);
    try {
      const res = await fetch(`/api/dashboard/${result.key}/detalhe?${buildQuery(filters, paginaAlvo)}`);
      if (!res.ok) throw new Error('Falha ao buscar detalhe');
      setDetalhe(await res.json());
      setPage(paginaAlvo);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    void carregarDetalhe(1);
  }

  const isAlert = ALERT_KEYS.has(result.key) && result.valor > 0;
  const valueColor = isAlert ? 'text-alert' : SIGNED_KEYS.has(result.key) && result.valor < 0 ? 'text-alert' : 'text-ink';
  const Icon = KPI_ICONS[result.key];

  return (
    <>
      <Card className="group relative overflow-hidden transition-colors hover:border-brass/50">
        <span className="absolute inset-y-0 left-0 w-1 bg-brass" aria-hidden="true" />
        <div className="flex items-start gap-3 p-4 pl-[18px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
            <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              <span className="truncate">{KPI_LABELS[result.key]}</span>
              <InfoTooltip label={KPI_HELP[result.key]} />
            </p>
            <button
              type="button"
              onClick={handleOpen}
              className="mt-0.5 w-full text-left"
              aria-label={`Ver detalhes de ${KPI_LABELS[result.key]}`}
            >
              <p className={`whitespace-nowrap font-mono-num text-[clamp(1.15rem,1.5vw,1.8rem)] font-bold leading-tight tracking-[-0.05em] ${valueColor}`}>
                {formatBRL(result.valor)}
              </p>
            </button>
            {result.comparacaoMesAnterior !== null && (
              <p className="mt-1 flex items-baseline gap-1 text-xs">
                <span className={result.comparacaoMesAnterior >= 0 ? 'text-favorable' : 'text-alert'}>
                  <span aria-hidden="true">{result.comparacaoMesAnterior >= 0 ? '▲' : '▼'}</span>{' '}
                  {percentAbs.format(Math.abs(result.comparacaoMesAnterior))}
                </span>
                <span className="text-muted">vs mês anterior</span>
              </p>
            )}
            {porMes && porMes.length > 0 && <QuebraPorMes keyKpi={result.key} porMes={porMes} />}
            {/* Só avisa quando os dados NÃO são reais. Confirmar a origem a cada
                card era ruído (o normal é ser real), mas deixar número inventado
                pelo MockErpAdapter passar por número de verdade, não. */}
            {result.isSimulated && (
              <p className="mt-1.5 text-[11px] uppercase tracking-wide text-alert">Dados simulados</p>
            )}
          </div>
        </div>
      </Card>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={KPI_LABELS[result.key]}
        description={KPI_HELP[result.key]}
      >
        {loading && !detalhe && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {erro && <InlineErrorState onRetry={() => carregarDetalhe(page)} />}
        {detalhe && !erro && (
          <div className="space-y-3">
            <DrilldownTable rows={detalhe.rows} />
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {detalhe.total} registro{detalhe.total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => carregarDetalhe(page - 1)}
                  className="rounded border border-border px-2 py-1 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page * detalhe.pageSize >= detalhe.total || loading}
                  onClick={() => carregarDetalhe(page + 1)}
                  className="rounded border border-border px-2 py-1 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

/**
 * Linha miúda abaixo do valor dizendo *quando* aquele dinheiro entra ou sai
 * — o total sozinho não distingue "entra este mês" de "entra em seis".
 *
 * Os dois cards pedem leituras diferentes: em Contas a Receber os meses são
 * poucos e olham pra frente, então cada um aparece com seu valor; em Contas
 * a Pagar a janela é fixa (dez/2025 até o fim do mês vigente) e quase tudo
 * já venceu, então nove linhas de valor viram ruído e o que interessa é o
 * período que o número cobre.
 */
function QuebraPorMes({ keyKpi, porMes }: { keyKpi: KpiKey; porMes: KpiMesValor[] }) {
  if (keyKpi === 'totalAPagar') {
    const primeiro = formatMonthKeyLabel(porMes[0]!.mes);
    const ultimo = formatMonthKeyLabel(porMes[porMes.length - 1]!.mes);
    return (
      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted/70">
        Vencimentos {primeiro === ultimo ? primeiro : `${primeiro} – ${ultimo}`}
      </p>
    );
  }

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
      {porMes.map(({ mes, valor }) => (
        <li key={mes} className="flex items-baseline gap-1">
          <span className="uppercase tracking-wide text-muted/70">{formatMonthKeyLabel(mes)}</span>
          <span className="font-mono-num text-muted">{formatBRL(valor)}</span>
        </li>
      ))}
    </ul>
  );
}
