import { describe, expect, it } from 'vitest';
import { computeTituloStatus } from '@/server/finance/tituloStatus';

const HOJE = new Date('2026-08-06T00:00:00');

describe('computeTituloStatus', () => {
  it('retorna CANCELADO quando canceladoEm está preenchido, independente de outros fatos', () => {
    const status = computeTituloStatus(
      {
        liquidado: true,
        dataVencimento: new Date('2026-01-01'),
        dataLiquidacao: new Date('2026-01-01'),
        dataCompetencia: new Date('2026-01-01'),
        canceladoEm: new Date('2026-01-05'),
      },
      HOJE,
    );
    expect(status).toBe('CANCELADO');
  });

  it('retorna REALIZADO quando liquidado é true', () => {
    const status = computeTituloStatus(
      {
        liquidado: true,
        dataVencimento: new Date('2026-01-01'),
        dataLiquidacao: new Date('2026-01-03'),
        dataCompetencia: new Date('2026-01-01'),
        canceladoEm: null,
      },
      HOJE,
    );
    expect(status).toBe('REALIZADO');
  });

  it('retorna VENCIDO quando não liquidado e vencimento já passou', () => {
    const status = computeTituloStatus(
      {
        liquidado: false,
        dataVencimento: new Date('2026-07-01'),
        dataLiquidacao: null,
        dataCompetencia: new Date('2026-07-01'),
        canceladoEm: null,
      },
      HOJE,
    );
    expect(status).toBe('VENCIDO');
  });

  it('retorna PREVISTO quando não liquidado e vencimento está no futuro', () => {
    const status = computeTituloStatus(
      {
        liquidado: false,
        dataVencimento: new Date('2026-09-01'),
        dataLiquidacao: null,
        dataCompetencia: new Date('2026-09-01'),
        canceladoEm: null,
      },
      HOJE,
    );
    expect(status).toBe('PREVISTO');
  });

  it('não usa dataLiquidacao (que é null) para decidir VENCIDO quando ainda não liquidado', () => {
    // Regressão: um título aberto nunca tem dataLiquidacao — a checagem de
    // vencido precisa usar dataVencimento, nunca dataLiquidacao.
    const status = computeTituloStatus(
      {
        liquidado: false,
        dataVencimento: new Date('2026-08-01'),
        dataLiquidacao: null,
        dataCompetencia: new Date('2026-08-01'),
        canceladoEm: null,
      },
      HOJE,
    );
    expect(status).toBe('VENCIDO');
  });
});
