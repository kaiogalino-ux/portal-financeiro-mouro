import { Badge } from '@/components/ui/Badge';
import type { TituloDrilldownRow } from '@/shared/types/dashboard.types';

const STATUS_CONFIG: Record<TituloDrilldownRow['status'], { label: string; tone: 'favorable' | 'alert' | 'neutral' }> = {
  PREVISTO: { label: 'Previsto', tone: 'neutral' },
  REALIZADO: { label: 'Realizado', tone: 'favorable' },
  VENCIDO: { label: 'Vencido', tone: 'alert' },
  CANCELADO: { label: 'Cancelado', tone: 'neutral' },
};

export function StatusBadge({ status }: { status: TituloDrilldownRow['status'] }) {
  const config = STATUS_CONFIG[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
