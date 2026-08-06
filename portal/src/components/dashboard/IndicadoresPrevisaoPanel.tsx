import { Badge } from '@/components/ui/Badge';
import type { IndicadorPrevisao, IndicadorPrevisaoNivel } from '@/shared/types/dashboard.types';

const NIVEL_CONFIG: Record<IndicadorPrevisaoNivel, { label: string; tone: 'favorable' | 'alert' | 'neutral' | 'brass' }> = {
  excelente: { label: 'Excelente', tone: 'favorable' },
  boa: { label: 'Boa', tone: 'brass' },
  atencao: { label: 'Atenção', tone: 'neutral' },
  critico: { label: 'Crítico', tone: 'alert' },
  neutro: { label: '—', tone: 'neutral' },
};

export function IndicadoresPrevisaoPanel({ indicadores }: { indicadores: IndicadorPrevisao[] }) {
  return (
    <ul className="space-y-3">
      {indicadores.map((indicador) => {
        const config = NIVEL_CONFIG[indicador.nivel];
        return (
          <li key={indicador.nome} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{indicador.nome}</span>
            <span className="flex items-center gap-2">
              <span className="font-mono-num text-ink">{indicador.valor}</span>
              <Badge tone={config.tone}>{config.label}</Badge>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
