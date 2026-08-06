import { describe, expect, it } from 'vitest';
import { percentChange, shiftPeriod, withDefaultPeriod } from '@/server/dashboard/period';

describe('percentChange', () => {
  it('calcula variação percentual normal', () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(80, 100)).toBeCloseTo(-0.2);
  });

  it('trata divisão por zero sem quebrar', () => {
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(100, 0)).toBeNull();
  });

  it('usa valor absoluto do anterior para não inverter sinal com base negativa', () => {
    // anterior = -100, atual = -50 -> melhora de 50%, não deveria ser -0.5 nem "queda"
    expect(percentChange(-50, -100)).toBeCloseTo(0.5);
  });
});

describe('withDefaultPeriod / shiftPeriod', () => {
  it('preenche período com o mês atual quando ausente', () => {
    const filters = withDefaultPeriod({ regime: 'caixa' });
    expect(filters.periodoInicio).toBeDefined();
    expect(filters.periodoFim).toBeDefined();
  });

  it('não sobrescreve período já informado', () => {
    const filters = withDefaultPeriod({
      regime: 'caixa',
      periodoInicio: '2026-01-01',
      periodoFim: '2026-01-31',
    });
    expect(filters.periodoInicio).toBe('2026-01-01');
    expect(filters.periodoFim).toBe('2026-01-31');
  });

  it('desloca o período em exatamente um mês para "mesAnterior"', () => {
    const shifted = shiftPeriod({ regime: 'caixa', periodoInicio: '2026-03-01', periodoFim: '2026-03-31' }, 'mesAnterior');
    expect(shifted.periodoInicio).toBe('2026-02-01');
  });

  it('desloca o período em exatamente um ano para "anoAnterior"', () => {
    const shifted = shiftPeriod({ regime: 'caixa', periodoInicio: '2026-03-01', periodoFim: '2026-03-31' }, 'anoAnterior');
    expect(shifted.periodoInicio).toBe('2025-03-01');
  });
});
