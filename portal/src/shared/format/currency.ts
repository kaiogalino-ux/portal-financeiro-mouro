import type { Prisma } from '@/generated/prisma';

export type MoneyInput = Prisma.Decimal | number | string;

function toNumber(value: MoneyInput): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return Number(value.toString());
}

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export function formatBRL(value: MoneyInput): string {
  return brl.format(toNumber(value));
}

export function formatBRLCompact(value: MoneyInput): string {
  return brlCompact.format(toNumber(value));
}

export function formatPercent(value: number): string {
  return percent.format(value);
}

export function formatNumber(value: MoneyInput): string {
  return new Intl.NumberFormat('pt-BR').format(toNumber(value));
}
