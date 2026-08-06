'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, toTooltipNumber } from '@/shared/format/chartColors';
import { formatBRLCompact } from '@/shared/format/currency';
import type { SeriesPoint } from '@/shared/types/dashboard.types';

export function AreaTrendChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="saldoProjetadoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.brass} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.brass} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.border} vertical={false} />
        <XAxis dataKey="label" stroke={CHART_COLORS.muted} tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          stroke={CHART_COLORS.muted}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(value: number) => formatBRLCompact(value)}
          width={64}
        />
        <Tooltip
          contentStyle={{ background: CHART_COLORS.surface2, border: `1px solid ${CHART_COLORS.border}`, borderRadius: 8 }}
          labelStyle={{ color: '#e7ecf3' }}
          formatter={(value) => formatBRLCompact(toTooltipNumber(value))}
        />
        <Area
          type="monotone"
          dataKey="saldoAcumulado"
          name="Saldo projetado"
          stroke={CHART_COLORS.brass}
          strokeWidth={2}
          fill="url(#saldoProjetadoGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
