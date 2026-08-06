'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DONUT_PALETTE, toTooltipNumber } from '@/shared/format/chartColors';
import { formatBRL, formatPercent } from '@/shared/format/currency';
import type { DonutSlice } from '@/shared/types/dashboard.types';

export function DonutChart({ data }: { data: DonutSlice[] }) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="nome" innerRadius={40} outerRadius={62} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.nome} fill={DONUT_PALETTE[index % DONUT_PALETTE.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#182335', border: '1px solid #26334a', borderRadius: 8 }}
            labelStyle={{ color: '#e7ecf3' }}
            formatter={(value) => formatBRL(toTooltipNumber(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-xs">
        {data.map((entry, index) => (
          <li key={entry.nome} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate text-muted">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_PALETTE[index % DONUT_PALETTE.length] }}
              />
              <span className="truncate">{entry.nome}</span>
            </span>
            <span className="flex-shrink-0 font-mono-num text-ink">{formatPercent(entry.percentual)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
