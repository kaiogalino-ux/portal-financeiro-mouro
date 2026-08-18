/**
 * Espelha as cores de src/app/globals.css (@theme) — Recharts precisa de
 * valores de cor reais em props SVG, não classes Tailwind. Mantenha os dois
 * em sincronia se a paleta mudar.
 */
export const CHART_COLORS = {
  favorable: 'var(--color-favorable)',
  alert: 'var(--color-alert)',
  neutral: 'var(--color-neutral)',
  brass: 'var(--color-brass)',
  muted: 'var(--color-muted)',
  border: 'var(--color-border)',
  surface: 'var(--color-surface)',
  surface2: 'var(--color-surface-2)',
  ink: 'var(--color-ink)',
} as const;

export const DONUT_PALETTE = ['#ff5a2a', '#51bc66', '#ff825c', '#89908c', '#d9362b', '#c4cac6'];

/** Verde = dinheiro que entra (clientes/recebíveis); tons fixos para funcionar nos dois temas. */
export const DONUT_PALETTE_FAVORABLE = ['#51bc66', '#2f9e4f', '#8fd69b', '#1f7a3d', '#bfe8c6', '#0f5c2e'];

/** Vermelho = dinheiro que sai (fornecedores/pagáveis). */
export const DONUT_PALETTE_ALERT = ['#ff4e43', '#d9362b', '#ff8a7a', '#a8271f', '#ffb3aa', '#7c1d17'];

/** Recharts entrega o valor do tooltip como number | string | array — nunca só number. */
export function toTooltipNumber(value: number | string | readonly (number | string)[] | undefined): number {
  if (Array.isArray(value)) return Number(value[0] ?? 0);
  return Number(value ?? 0);
}
