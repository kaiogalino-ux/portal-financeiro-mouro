/**
 * Espelha as cores de src/app/globals.css (@theme) — Recharts precisa de
 * valores de cor reais em props SVG, não classes Tailwind. Mantenha os dois
 * em sincronia se a paleta mudar.
 */
export const CHART_COLORS = {
  favorable: '#34d399',
  alert: '#f16565',
  neutral: '#5b7ba8',
  brass: '#c6a15b',
  muted: '#8b98af',
  border: '#26334a',
  surface2: '#182335',
} as const;

export const DONUT_PALETTE = ['#c6a15b', '#34d399', '#5b7ba8', '#8a7248', '#3a4a63', '#4a5b76'];

/** Recharts entrega o valor do tooltip como number | string | array — nunca só number. */
export function toTooltipNumber(value: number | string | readonly (number | string)[] | undefined): number {
  if (Array.isArray(value)) return Number(value[0] ?? 0);
  return Number(value ?? 0);
}
