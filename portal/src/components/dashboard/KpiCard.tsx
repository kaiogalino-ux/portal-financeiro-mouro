'use client';

import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { Sheet } from '@/components/ui/Sheet';
import { InlineErrorState, Skeleton } from '@/components/ui/States';
import { formatBRL, formatPercent } from '@/shared/format/currency';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import type { DrilldownResult, KpiResult } from '@/shared/types/dashboard.types';
import { KPI_HELP, KPI_LABELS } from '@/shared/types/dashboard.types';
import { DrilldownTable } from './DrilldownTable';

/** Cards de valor negativo/vencido não são "favoráveis" por convenção — só
 * resultadoDoPeriodo e saldoProjetado ganham cor por sinal; os demais são neutros. */
const SIGNED_KEYS = new Set(['resultadoDoPeriodo', 'saldoProjetado']);
const ALERT_KEYS = new Set(['titulosVencidos']);

function buildQuery(filters: DashboardFilters, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set('page', String(page));
  params.set('pageSize', '20');
  return params.toString();
}

export function KpiCard({ result, filters }: { result: KpiResult; filters: DashboardFilters }) {
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            {KPI_LABELS[result.key]}
            <InfoTooltip label={KPI_HELP[result.key]} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={handleOpen}
            className="w-full text-left"
            aria-label={`Ver detalhes de ${KPI_LABELS[result.key]}`}
          >
            <p className={`font-display text-2xl font-medium ${valueColor}`}>{formatBRL(result.valor)}</p>
          </button>
          <div className="mt-2 flex gap-3 text-xs">
            <DeltaIndicator label="vs mês anterior" value={result.comparacaoMesAnterior} />
            <DeltaIndicator label="vs ano anterior" value={result.comparacaoAnoAnterior} />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-wide text-muted/70">
            {result.isSimulated ? 'Dados simulados' : 'Dados reais · Gestão Click'}
          </p>
        </CardContent>
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

function DeltaIndicator({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <span className="flex items-center gap-1 text-muted">
        <Minus size={12} /> {label}
      </span>
    );
  }
  const favorable = value >= 0;
  return (
    <span className={`flex items-center gap-1 ${favorable ? 'text-favorable' : 'text-alert'}`}>
      {favorable ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {formatPercent(value)} {label}
    </span>
  );
}
