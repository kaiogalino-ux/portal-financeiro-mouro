'use client';

import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CHART_COLORS, toTooltipNumber } from '@/shared/format/chartColors';
import { formatBRLCompact } from '@/shared/format/currency';
import type { SeriesPoint } from '@/shared/types/dashboard.types';

export function ComboBarLineChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
        <Bar dataKey="entradas" name="Entradas" fill={CHART_COLORS.favorable} radius={[3, 3, 0, 0]} />
        <Bar dataKey="saidas" name="Saídas" fill={CHART_COLORS.alert} radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="saldoAcumulado"
          name="Saldo acumulado"
          stroke={CHART_COLORS.brass}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
