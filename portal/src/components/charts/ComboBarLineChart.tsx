'use client';

import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CHART_COLORS, toTooltipNumber } from '@/shared/format/chartColors';
import { formatBRLCompact, formatNumber } from '@/shared/format/currency';
import type { SeriesPoint } from '@/shared/types/dashboard.types';

export function ComboBarLineChart({ data }: { data: SeriesPoint[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-favorable" aria-hidden="true" />
          Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-alert" aria-hidden="true" />
          Saídas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative h-px w-4 bg-ink" aria-hidden="true">
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
          </span>
          Saldo acumulado
        </span>
      </div>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
          <CartesianGrid stroke={CHART_COLORS.border} vertical={false} />
          <XAxis dataKey="label" stroke={CHART_COLORS.muted} tickLine={false} axisLine={false} fontSize={11} dy={4} />
          <YAxis
            stroke={CHART_COLORS.muted}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(value: number) => formatNumber(value)}
            width={74}
          />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.surface2, border: `1px solid ${CHART_COLORS.border}`, borderRadius: 8 }}
            labelStyle={{ color: 'var(--color-ink)' }}
            formatter={(value) => formatBRLCompact(toTooltipNumber(value))}
          />
          <Bar dataKey="entradas" name="Entradas" fill={CHART_COLORS.favorable} radius={[2, 2, 0, 0]} maxBarSize={22} />
          <Bar dataKey="saidas" name="Saídas" fill={CHART_COLORS.alert} radius={[2, 2, 0, 0]} maxBarSize={22} />
          <Line
            type="monotone"
            dataKey="saldoAcumulado"
            name="Saldo acumulado"
            stroke={CHART_COLORS.ink}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.ink, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
