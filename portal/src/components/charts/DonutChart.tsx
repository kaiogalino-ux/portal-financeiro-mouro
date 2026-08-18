'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DONUT_PALETTE_ALERT, DONUT_PALETTE_FAVORABLE, toTooltipNumber } from '@/shared/format/chartColors';
import { formatBRL, formatBRLCompact } from '@/shared/format/currency';
import type { DonutSlice } from '@/shared/types/dashboard.types';

/** Sem sinal nem casas — a legenda da referência mostra "41%", não "+41,2%". */
const percentInteiro = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

/** Valores da legenda sem centavos, como na referência; o tooltip mantém o valor exato. */
const brlSemCentavos = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function DonutChart({ data, tone = 'favorable' }: { data: DonutSlice[]; tone?: 'favorable' | 'alert' }) {
  const palette = tone === 'alert' ? DONUT_PALETTE_ALERT : DONUT_PALETTE_FAVORABLE;
  const total = data.reduce((soma, slice) => soma + slice.valor, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-4">
      <div className="relative h-[132px] w-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="valor" nameKey="nome" innerRadius={43} outerRadius={63} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.nome} fill={palette[index % palette.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--color-ink)' }}
              formatter={(value) => formatBRL(toTooltipNumber(value))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono-num text-base font-semibold leading-tight text-ink">{formatBRLCompact(total)}</p>
          <p className="text-[11px] text-muted">Total</p>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2 text-[11px]">
        {data.map((entry, index) => (
          <li key={entry.nome} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: palette[index % palette.length] }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-muted" title={entry.nome}>
              {entry.nome}
            </span>
            <span className="flex-shrink-0 font-mono-num text-ink">{brlSemCentavos.format(entry.valor)}</span>
            <span className="w-8 flex-shrink-0 text-right font-mono-num text-muted">
              {percentInteiro.format(entry.percentual)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
