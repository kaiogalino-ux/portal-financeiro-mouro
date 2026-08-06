import { endOfMonth, formatISO, startOfMonth, subMonths, subYears } from 'date-fns';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import { todayInSaoPaulo } from '@/shared/format/date';

function toIsoDate(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

/** Preenche periodoInicio/periodoFim com o mês atual quando não informados. */
export function withDefaultPeriod(filters: DashboardFilters): DashboardFilters {
  if (filters.periodoInicio && filters.periodoFim) return filters;
  const hoje = todayInSaoPaulo();
  return {
    ...filters,
    periodoInicio: filters.periodoInicio ?? toIsoDate(startOfMonth(hoje)),
    periodoFim: filters.periodoFim ?? toIsoDate(endOfMonth(hoje)),
  };
}

export function shiftPeriod(filters: DashboardFilters, kind: 'mesAnterior' | 'anoAnterior'): DashboardFilters {
  const base = withDefaultPeriod(filters);
  const inicio = new Date(`${base.periodoInicio}T00:00:00`);
  const fim = new Date(`${base.periodoFim}T00:00:00`);
  const shift = kind === 'mesAnterior' ? subMonths : subYears;

  return {
    ...base,
    periodoInicio: toIsoDate(shift(inicio, 1)),
    periodoFim: toIsoDate(shift(fim, 1)),
  };
}

export function percentChange(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return (atual - anterior) / Math.abs(anterior);
}
