import { Banknote, CheckCircle2, Clock, FileText, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { IndicadorPrevisao, IndicadorPrevisaoNivel } from '@/shared/types/dashboard.types';

/** Verde para o que está saudável, laranja para o que pede olho, vermelho só
 * para o que já é problema — a mesma escala de cor dos selos da referência. */
const NIVEL_CONFIG: Record<IndicadorPrevisaoNivel, { label: string; tone: 'favorable' | 'alert' | 'neutral' | 'brass' }> = {
  excelente: { label: 'Excelente', tone: 'favorable' },
  boa: { label: 'Boa', tone: 'favorable' },
  atencao: { label: 'Atenção', tone: 'brass' },
  critico: { label: 'Crítico', tone: 'alert' },
  neutro: { label: '—', tone: 'neutral' },
};

/** Ícone decorativo por assunto — casa cada linha com a referência visual. */
function iconePorNome(nome: string): typeof Gauge {
  const chave = nome.toLowerCase();
  if (chave.includes('liquidez')) return Banknote;
  if (chave.includes('cobertura')) return CheckCircle2;
  if (chave.includes('atenção') || chave.includes('atencao')) return Clock;
  if (chave.includes('capital')) return FileText;
  return Gauge;
}

export function IndicadoresPrevisaoPanel({ indicadores }: { indicadores: IndicadorPrevisao[] }) {
  return (
    <ul className="space-y-3.5">
      {indicadores.map((indicador) => {
        const config = NIVEL_CONFIG[indicador.nivel];
        const Icon = iconePorNome(indicador.nome);
        return (
          <li key={indicador.nome} className="flex items-center gap-2 text-[13px]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted">
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate text-muted" title={indicador.nome}>
              {indicador.nome}
            </span>
            <span className="shrink-0 font-mono-num text-[13px] font-medium text-ink">{indicador.valor}</span>
            <Badge
              tone={config.tone}
              solid
              className="w-[74px] shrink-0 justify-center rounded-md px-1 py-1 text-[9px] font-bold uppercase tracking-[0.04em]"
            >
              {config.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
