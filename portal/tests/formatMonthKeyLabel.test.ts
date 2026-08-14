import { describe, expect, it } from 'vitest';
import { formatMonthKeyLabel } from '@/shared/format/date';

describe('formatMonthKeyLabel', () => {
  it('formata a chave de calendário como MÊS/AA', () => {
    expect(formatMonthKeyLabel('2026-08')).toBe('AGO/26');
    expect(formatMonthKeyLabel('2025-12')).toBe('DEZ/25');
    expect(formatMonthKeyLabel('2026-01')).toBe('JAN/26');
  });

  it('acerta as bordas do ano sem depender de fuso', () => {
    // Passar por Date faria janeiro virar dezembro do ano anterior em
    // servidor a leste de Greenwich.
    expect(formatMonthKeyLabel('2026-01')).toBe('JAN/26');
    expect(formatMonthKeyLabel('2026-12')).toBe('DEZ/26');
  });

  it('devolve a chave crua quando o mês não faz sentido, em vez de quebrar a tela', () => {
    expect(formatMonthKeyLabel('2026-13')).toBe('2026-13');
    expect(formatMonthKeyLabel('2026-00')).toBe('2026-00');
    expect(formatMonthKeyLabel('qualquer coisa')).toBe('qualquer coisa');
  });
});
