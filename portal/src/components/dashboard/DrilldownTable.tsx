import { formatBRL } from '@/shared/format/currency';
import { formatDate } from '@/shared/format/date';
import type { TituloDrilldownRow } from '@/shared/types/dashboard.types';
import { EmptyState } from '@/components/ui/States';
import { StatusBadge } from './StatusBadge';

export function DrilldownTable({ rows }: { rows: TituloDrilldownRow[] }) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="py-2 pr-3 font-normal">Descrição</th>
            <th className="py-2 pr-3 font-normal">Contraparte</th>
            <th className="py-2 pr-3 font-normal">Vencimento</th>
            <th className="py-2 pr-3 font-normal">Status</th>
            <th className="py-2 pr-3 text-right font-normal">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60">
              <td className="py-2 pr-3 text-ink">{row.descricao}</td>
              <td className="py-2 pr-3 text-muted">{row.contraparte}</td>
              <td className="py-2 pr-3 font-mono-num text-muted">{formatDate(row.dataVencimento)}</td>
              <td className="py-2 pr-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="py-2 pr-3 text-right font-mono-num text-ink">{formatBRL(row.valorTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
