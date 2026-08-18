'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, toTooltipNumber } from '@/shared/format/chartColors';
import { formatBRL, formatBRLCompact, formatNumber } from '@/shared/format/currency';
import type { SeriesPoint } from '@/shared/types/dashboard.types';

export function AreaTrendChart({ data }: { data: SeriesPoint[] }) {
  const ultimo = data.at(-1);

  return (
    <div className="relative">
      {/* Etiqueta com o saldo do último mês projetado — mesmo dado da última
          bolinha da série, só destacado como na referência visual. O fio
          vertical liga a etiqueta ao ponto que ela descreve. */}
      {ultimo && (
        <span className="pointer-events-none absolute right-1 top-0 z-10 flex flex-col items-center">
          <span className="rounded-md bg-brass px-2.5 py-1 font-mono-num text-xs font-medium text-white shadow-sm">
            {formatBRL(ultimo.saldoAcumulado)}
          </span>
          <span className="h-3 w-px bg-brass" aria-hidden="true" />
        </span>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 26, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoProjetadoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.brass} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.brass} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="saldoAcumulado"
            name="Saldo projetado"
            stroke={CHART_COLORS.brass}
            strokeWidth={2}
            fill="url(#saldoProjetadoGradient)"
            dot={{ r: 3.5, stroke: CHART_COLORS.brass, strokeWidth: 2, fill: CHART_COLORS.surface }}
            activeDot={{ r: 4.5, stroke: CHART_COLORS.brass, strokeWidth: 2, fill: CHART_COLORS.surface }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
